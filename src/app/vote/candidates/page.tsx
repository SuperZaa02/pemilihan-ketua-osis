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
  const gridColumns =
    candidates.length <= 1
      ? "sm:grid-cols-1 sm:max-w-md sm:mx-auto"
      : candidates.length <= 4
        ? "sm:grid-cols-2 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto"
        : candidates.length <= 6
          ? "lg:grid-cols-3"
          : candidates.length <= 8 || candidates.length > 9
            ? "lg:grid-cols-4"
            : "lg:grid-cols-3";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Pilih Kandidat
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Halo, <span className="font-medium text-zinc-800">{voter.fullName}</span>{" "}
          — pilih salah satu kandidat di bawah.
        </p>
        <p className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
          Jumlah kandidat: {candidates.length}
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
        <div className={`grid grid-cols-1 gap-4 ${gridColumns}`}>
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/vote/candidates/${candidate.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
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
              <div className="flex flex-col gap-1 p-5">
                <h2 className="font-medium text-zinc-900 group-hover:underline">
                  {candidate.fullName}
                </h2>
                <p className="text-sm text-zinc-600">{candidate.placementName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
