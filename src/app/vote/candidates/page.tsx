import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { placements, voters, votes } from "@/db/schema";
import { getVoterSession } from "@/lib/auth/voter-session";
import {
  getCachedActiveCandidates,
  getCachedActiveElection,
} from "@/lib/queries/cached";
import { checkEligibility } from "@/lib/queries/eligibility";

export const metadata: Metadata = {
  title: "Pilih Kandidat",
};

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
    redirect("/vote?error=not-found");
  }

  const election = await getCachedActiveElection();

  if (!election || election.status !== "open") {
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
    redirect("/vote/done");
  }

  const candidates = await getCachedActiveCandidates();

  /*
   * Grid dibuat berdasarkan jumlah kandidat agar penggunaan ruang
   * tetap seimbang di desktop.
   *
   * 1 kandidat  -> 1 kolom, card tidak terlalu besar
   * 2 kandidat  -> 2 kolom
   * 3 kandidat  -> 3 kolom
   * 4 kandidat  -> 2x2
   * 5-6 kandidat -> 3 kolom
   * 7-8 kandidat -> 4 kolom
   * 9+ kandidat  -> 4 kolom
   */
  const gridColumns =
    candidates.length === 1
      ? "max-w-sm mx-auto"
      : candidates.length === 2
        ? "sm:grid-cols-2 max-w-3xl mx-auto"
        : candidates.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
          : candidates.length === 4
            ? "sm:grid-cols-2 max-w-4xl mx-auto"
            : candidates.length <= 6
              ? "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
              : "sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          Pilih Kandidat
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500 sm:text-base">
          Halo,{" "}
          <span className="font-medium text-zinc-800">
            {voter.fullName}
          </span>
          . Pilih kandidat yang menurutmu paling tepat untuk memimpin.
        </p>
      </header>

      {/* Error */}
      {error === "candidate" && (
        <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Kandidat tidak valid atau sudah tidak aktif. Silakan pilih kembali.
        </div>
      )}

      {/* Empty state */}
      {candidates.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">
            Belum ada kandidat yang berpartisipasi.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-5 sm:gap-6 ${gridColumns}`}
        >
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/vote/candidates/${candidate.id}`}
              className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-4"
            >
              {/* Portrait */}
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                {candidate.photoUrl ? (
                  <Image
                    src={candidate.photoUrl}
                    alt={candidate.fullName}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    sizes="
                      (max-width: 640px) 100vw,
                      (max-width: 1024px) 50vw,
                      25vw
                    "
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                    <span className="text-7xl font-semibold tracking-tight text-zinc-300">
                      {candidate.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Subtle bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                {/* Candidate information */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {candidate.fullName}
                  </h2>

                  <p className="mt-1 text-sm text-white/75">
                    Kelas {candidate.placementName}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
