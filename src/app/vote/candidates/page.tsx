import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { placements, voters, votes } from "@/db/schema";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getCachedActiveCandidates, getCachedActiveElection } from "@/lib/queries/cached";
import { checkEligibility } from "@/lib/queries/eligibility";

export const metadata: Metadata = {
  title: "Pilih Kandidat | Pemilihan Ketua OSIS",
};

/**
 * PAKAI CACHE untuk daftar kandidat & data pemilihan (tag "candidates" /
 * "election"). Verifikasi session & eligibility tetap selalu fresh karena
 * membaca cookies + tabel votes langsung.
 */
export default async function VoteCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const voterSession = await getVoterSession();
  if (!voterSession) {
    redirect("/vote");
  }

  // Verifikasi ulang di server: voter, election, eligibility.
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

  if (!voter) redirect("/vote?error=not-found");

  const election = await getCachedActiveElection();
  if (!election || election.status !== "open") {
    redirect("/vote?error=not-available");
  }

  const eligibility = checkEligibility(voter, election);
  if (!eligibility.eligible) {
    redirect(`/vote?error=${encodeURIComponent(eligibility.reason)}`);
  }

  // Sudah memilih? langsung ke halaman selesai.
  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voter.id))
    .limit(1);

  if (existingVote) {
    redirect("/vote/done");
  }

  const candidates = await getCachedActiveCandidates();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Pilih Kandidat
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Halo, <span className="font-medium text-zinc-800">{voter.fullName}</span>{" "}
          — pilih salah satu kandidat di bawah. Keputusan Anda bersifat rahasia
          dan tidak dapat diubah setelah dikirim.
        </p>
      </header>

      {error === "candidate" && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Kandidat tidak valid atau sudah tidak aktif. Silakan pilih kembali.
        </p>
      )}

      {candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-600">
            Belum ada kandidat yang berpartisipasi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/vote/candidates/${candidate.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-400"
            >
              <div className="relative aspect-[4/5] bg-zinc-100">
                {candidate.photoUrl ? (
                  <Image
                    src={candidate.photoUrl}
                    alt={candidate.fullName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-semibold text-zinc-400">
                    {candidate.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h2 className="font-medium text-zinc-900 group-hover:underline">
                  {candidate.fullName}
                </h2>
                <p className="text-sm text-zinc-600">
                  {candidate.placementName}
                </p>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-zinc-700">
                  <span className="font-medium">Program kerja: </span>
                  {candidate.programKerja}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
