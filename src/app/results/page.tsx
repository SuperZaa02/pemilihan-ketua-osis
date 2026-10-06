import Image from "next/image";
import { Clock } from "lucide-react";

import Link from "next/link";
import { ResultsCountdown } from "@/components/results-countdown";
import { Card } from "@/components/ui";
import { getActiveElection, isResultsOpen } from "@/lib/queries/election";
import { getElectionResults } from "@/lib/queries/results";
import { formatJakartaDateTime } from "@/lib/datetime";

export const metadata = {
  title: "Hasil Pemilihan",
};

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const election = await getActiveElection();
  const openResults = await isResultsOpen(election);

  if (!openResults) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <Clock className="h-6 w-6" aria-hidden />
          </div>

          <h1 className="text-lg font-semibold text-zinc-900">
            {election?.resultsPublicationMode === "manual"
              ? "Hasil Menunggu Dibuka Admin"
              : "Menunggu Publikasi Hasil"}
          </h1>
          {election ? (
            <>
              <p className="mt-2 text-sm text-zinc-600">{election.name}</p>
              {election.resultsPublicationMode === "manual" ? (
                <p className="mt-2 text-sm text-zinc-600">
                  Hasil akan ditampilkan setelah admin membukanya secara manual.
                  Silakan cek kembali nanti.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-zinc-600">
                    Hasil akan dipublikasikan otomatis pada{" "}
                    {formatJakartaDateTime(
                      election.resultsOpenAt ?? election.endsAt,
                    )}.
                  </p>
                  {election.status !== "closed" ? (
                    <p className="mt-2 text-sm text-zinc-600">
                      Hasil menunggu jadwal dan status pemilihan ditutup oleh
                      admin.
                    </p>
                  ) : (election.resultsOpenAt ?? election.endsAt) > new Date() ? (
                    <ResultsCountdown
                      opensAt={(election.resultsOpenAt ?? election.endsAt).toISOString()}
                    />
                  ) : (
                    <p className="mt-3 text-sm font-medium text-zinc-700">
                      Jadwal publikasi telah tiba. Hasil segera tersedia.
                    </p>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              Jadwal pemilihan belum tersedia.
            </p>
          )}

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-300"
          >
            Kembali ke Halaman Beranda
          </Link>
        </div>
      </main>
    );
  }

  const results = await getElectionResults();

  const sorted = [...results.perCandidate].sort(
    (a, b) => b.voteCount - a.voteCount,
  );
  const leader = sorted[0];

  const totalVotesDisplay = results.totalVotes;
  const totalVotersDisplay = results.totalVoters;
  const participationDisplay = totalVotersDisplay > 0
    ? Math.round((totalVotesDisplay / totalVotersDisplay) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          {election && (
            <h1 className="text-3xl font-bold text-zinc-900">{election.name}</h1>
          )}
          <p className="mt-2 text-sm text-zinc-600">
            Hasil Pemilihan Ketua OSIS
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:items-start">
          <aside className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Total Pemilih
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {totalVotersDisplay}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Partisipasi
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {participationDisplay}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Suara Masuk
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {totalVotesDisplay}
              </p>
            </Card>
          </aside>

          {/* Results List */}
          {totalVotesDisplay === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-zinc-600">Belum ada suara masuk.</p>
            </Card>
          ) : (
            <Card className="flex flex-col divide-y divide-zinc-100">
              {leader && leader.voteCount > 0 && (
                <p className="px-4 py-3 text-center text-sm leading-relaxed text-zinc-500">
                  Hasil {election.name} berhasil di menangkan oleh{" "}
                  <span className="font-medium text-zinc-900">"{leader.fullName}"</span>{" "}
                  dari kelas {leader.placementName} dengan <span className="font-bold text-zinc-900">{leader.voteCount} suara.</span>
                </p>
              )}
              {sorted.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center gap-4 p-4">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      index === 0 && candidate.voteCount > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {candidate.photoUrl ? (
                      <Image
                        src={candidate.photoUrl}
                        alt={candidate.fullName}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-400">
                        {candidate.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium text-zinc-900">
                        {candidate.fullName}
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          {candidate.placementName}
                        </span>
                      </p>
                      <p className="shrink-0 text-sm font-medium text-zinc-900">
                        {candidate.voteCount} suara
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 && candidate.voteCount > 0
                            ? "bg-emerald-500"
                            : "bg-zinc-400"
                        }`}
                        style={{ width: `${candidate.percent}%` }}
                      />
                    </div>
                  </div>

                  <span className="w-12 shrink-0 text-right text-sm text-zinc-500">
                    {candidate.percent}%
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          {election?.resultsPublicationMode === "manual"
            ? "Hasil dibuka oleh admin."
            : `Hasil dipublikasikan otomatis pada ${formatJakartaDateTime(
                election?.resultsOpenAt ?? election?.endsAt ?? new Date(),
              )}.`}
        </div>

        {/* Back to Vote */}
        <div className="mt-8 text-center">
          <a
            href="/vote"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Kembali ke Halaman Voting
          </a>
        </div>
      </div>
    </main>
  );
}