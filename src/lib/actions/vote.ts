"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { candidates, voters, votes } from "@/db/schema";
import {
  destroyVoterSession,
  createVoterSession,
  getVoterSession,
} from "@/lib/auth/voter-session";
import { checkEligibility } from "@/lib/queries/eligibility";
import { getActiveElection } from "@/lib/queries/election";
import { findVoterByIdentity } from "@/lib/queries/voters";

// ---------- Langkah 1: identitas ----------

const identitySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(120),
  placement: z.string().trim().min(2, "Penempatan wajib diisi").max(60),
});

export type IdentityState = {
  error: string | null;
  /** Data untuk preview konfirmasi ("Apakah Anda ...?"). */
  matched: { fullName: string; placement: string; type: string } | null;
};

export async function identifyVoterAction(
  _prev: IdentityState,
  formData: FormData,
): Promise<IdentityState> {
  const parsed = identitySchema.safeParse({
    fullName: formData.get("fullName"),
    placement: formData.get("placement"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
      matched: null,
    };
  }

  const voter = await findVoterByIdentity(
    parsed.data.fullName,
    parsed.data.placement,
  );

  if (!voter) {
    // Pesan generik: tidak membocorkan data pemilih mana yang ada.
    return {
      error:
        "Data tidak ditemukan. Periksa ejaan nama dan penempatan, atau hubungi panitia.",
      matched: null,
    };
  }

  return {
    error: null,
    matched: {
      fullName: voter.fullName,
      placement: voter.placement,
      type: voter.type,
    },
  };
}

// ---------- Langkah 2: konfirmasi identitas ----------

const confirmSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  placement: z.string().trim().min(2).max(60),
});

export async function confirmIdentityAction(
  formData: FormData,
): Promise<void> {
  const parsed = confirmSchema.safeParse({
    fullName: formData.get("fullName"),
    placement: formData.get("placement"),
  });

  if (!parsed.success) {
    redirect("/vote");
  }

  const voter = await findVoterByIdentity(
    parsed.data.fullName,
    parsed.data.placement,
  );

  if (!voter) {
    redirect("/vote");
  }

  // Eligibility dicek ulang di server (jangan percaya alur client).
  const election = await getActiveElection();
  if (!election) {
    redirect("/vote?error=not-available");
  }

  const eligibility = checkEligibility(voter, election);
  if (!eligibility.eligible) {
    redirect(`/vote?error=${encodeURIComponent(eligibility.reason)}`);
  }

  // Sudah pernah memilih? blokir dengan pesan jelas.
  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voter.id))
    .limit(1);

  if (existingVote) {
    redirect(
      `/vote?error=${encodeURIComponent("Anda sudah menggunakan hak pilih.")}`,
    );
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
    // Session kedaluwarsa/invalid -> ulang alur identitas.
    redirect("/vote?error=session");
  }

  // Ambil ulang voter + election dari DB (jangan percaya client).
  const [voter] = await db
    .select()
    .from(voters)
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

  // Insert final. UNIQUE(voter_id) menjamin satu pemilih satu suara:
  // kalau terjadi race condition, insert kedua gagal di level database.
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
        .where(eq(voters.id, voter.id));
    });
  } catch {
    // Pelanggaran unique / race condition -> anggap sudah memilih.
    redirect("/vote/done");
  }

  await destroyVoterSession();
  revalidatePath("/admin/results");
  revalidatePath("/admin");
  redirect("/vote/done");
}

// ---------- Langkah 4: batal ----------

export async function cancelVotingAction(): Promise<void> {
  await destroyVoterSession();
  redirect("/vote");
}
