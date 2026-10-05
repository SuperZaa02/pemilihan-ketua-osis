"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { candidates, placements, voters, votes } from "@/db/schema";
import {
  destroyVoterSession,
  createVoterSession,
  getVoterSession,
} from "@/lib/auth/voter-session";
import { checkEligibility } from "@/lib/queries/eligibility";
import { getActiveElection } from "@/lib/queries/election";
import { getVotersForPlacement } from "@/lib/queries/voters";

// ---------- Pilih kelas dan pemilih ----------

const placementSchema = z.object({
  placementId: z.string().regex(/^[0-9a-f-]{36}$/i, "Pilih kelas yang valid."),
});

export type VoterListState = {
  error: string | null;
  placementId: string | null;
  voters: { id: string; fullName: string; type: "student" | "teacher"; hasVoted: boolean }[];
};

export async function loadVotersByPlacementAction(
  _prev: VoterListState,
  formData: FormData,
): Promise<VoterListState> {
  const parsed = placementSchema.safeParse({
    placementId: formData.get("placementId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
      placementId: null,
      voters: [],
    };
  }

  const election = await getActiveElection();
  if (!election) {
    return { error: "Belum ada pemilihan yang tersedia.", placementId: null, voters: [] };
  }

  const [placement] = await db
    .select({ id: placements.id, name: placements.name, type: placements.type })
    .from(placements)
    .where(eq(placements.id, parsed.data.placementId))
    .limit(1);

  if (!placement) {
    return {
      error: "Kelas tidak ditemukan.",
      placementId: null,
      voters: [],
    };
  }

  const placementAllowed = election.allowedPlacements.some(
    (name) => name.trim().toUpperCase() === placement.name.trim().toUpperCase(),
  );
  if (!placementAllowed) {
    return {
      error: "Kelas ini tidak diizinkan memilih pada pemilihan ini.",
      placementId: null,
      voters: [],
    };
  }

  const eligibility = checkEligibility(
    { type: placement.type, placementName: placement.name },
    election,
  );
  if (!eligibility.eligible) {
    return { error: eligibility.reason, placementId: null, voters: [] };
  }

  const voterList = await getVotersForPlacement(placement.id);

  return {
    error: voterList.length === 0 ? "Belum ada pemilih terdaftar di kelas ini." : null,
    placementId: placement.id,
    voters: voterList,
  };
}

// ---------- Login pemilih ----------

const voterSchema = z.object({
  voterId: z.string().regex(/^[0-9a-f-]{36}$/i, "Pilih nama pemilih yang valid."),
});

export async function loginVoterAction(formData: FormData): Promise<void> {
  const parsed = voterSchema.safeParse({ voterId: formData.get("voterId") });
  if (!parsed.success) {
    redirect("/vote?error=not-found");
  }

  const [voter] = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placementName: placements.name,
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(eq(voters.id, parsed.data.voterId))
    .limit(1);

  if (!voter) {
    redirect("/vote?error=not-found");
  }

  const election = await getActiveElection();
  if (!election) {
    redirect("/vote?error=not-available");
  }

  const eligibility = checkEligibility(voter, election);
  if (!eligibility.eligible) {
    redirect(`/vote?error=${encodeURIComponent(eligibility.reason)}`);
  }

  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voter.id))
    .limit(1);

  if (existingVote) {
    redirect(`/vote?error=${encodeURIComponent("Anda sudah menggunakan hak pilih.")}`);
  }

  await createVoterSession(voter.id);
  redirect("/vote/candidates");
}

// ---------- Langkah 3: submit vote (transaksional) ----------

const voteSchema = z.object({
  candidateId: z.string().regex(/^[0-9a-f-]{36}$/i, "Kandidat tidak valid."),
});

export async function submitVoteAction(formData: FormData): Promise<void> {
  const parsed = voteSchema.safeParse({
    candidateId: formData.get("candidateId"),
  });

  if (!parsed.success) {
    redirect("/vote/candidates?error=invalid");
  }

  const voterSession = await getVoterSession();
  if (!voterSession) {
    // Session kedaluwarsa/invalid -> ulang alur login pemilih.
    redirect("/vote?error=session");
  }

  // Ambil ulang voter + election dari DB (jangan percaya client).
  const [voter] = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placementName: placements.name,
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(eq(voters.id, voterSession.vid))
    .limit(1);

  if (!voter) {
    await destroyVoterSession();
    redirect("/vote?error=not-found");
  }

  const election = await getActiveElection();
  if (!election) {
    redirect("/vote?error=not-available");
  }

  const eligibility = checkEligibility(voter, election);
  if (!eligibility.eligible) {
    await destroyVoterSession();
    redirect(`/vote?error=${encodeURIComponent(eligibility.reason)}`);
  }

  // Kandidat harus ada & aktif.
  const [candidate] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(
      and(
        eq(candidates.id, parsed.data.candidateId),
        eq(candidates.status, "active"),
      ),
    )
    .limit(1);

  if (!candidate) {
    redirect("/vote/candidates?error=candidate");
  }

  // Sudah memilih? langsung ke halaman selesai.
  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voter.id))
    .limit(1);

  if (existingVote) {
    await destroyVoterSession();
    redirect("/vote/done");
  }

  /**
   * Anti race condition (double-vote):
   * 1. UNIQUE(voter_id) di level database menolak insert kedua — lapisan
   *    terakhir yang tidak bisa ditembus bug logika maupun request paralel.
   * 2. Update identityConfirmedAt diberi kondisi IS NULL: hanya SUARA BARU
   *    yang mengubah status, jadi reset pilihan oleh admin tidak menandai
   *    pemilih "sudah konfirmasi" secara keliru.
   * 3. Insert vote dilakukan lebih dulu dalam transaksi; kegagalan apa pun
   *    (termasuk pelanggaran unique) mengarahkan pemilih dengan aman.
   */
  try {
    await db.transaction(async (tx) => {
      await tx.insert(votes).values({
        voterId: voter.id,
        candidateId: parsed.data.candidateId,
        isTeacherVote: voter.type === "teacher",
      });
      await tx
        .update(voters)
        .set({ identityConfirmedAt: new Date() })
        .where(
          and(eq(voters.id, voter.id), isNull(voters.identityConfirmedAt)),
        );
    });
  } catch {
    // Pelanggaran unique / race condition -> anggap sudah memilih.
    await destroyVoterSession();
    redirect("/vote/done");
  }

  await destroyVoterSession();
  revalidatePath("/admin/results");
  revalidatePath("/admin");
  updateTag("election"); // status partisipasi tampil di halaman publik
  redirect("/vote/done");
}

// ---------- Langkah 4: batal ----------

export async function cancelVotingAction(): Promise<void> {
  await destroyVoterSession();
  redirect("/vote");
}
