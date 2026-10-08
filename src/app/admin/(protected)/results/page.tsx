import Image from "next/image";
import { Lock, RotateCcw, Unlock } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/admin/election-form";
import { ResultsRefresh } from "@/components/admin/results-refresh";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import {
  resetResultsAction,
  setManualResultsStatusAction,
} from "@/lib/actions/election";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getElectionResults } from "@/lib/queries/results";
import { getActiveElection, isResultsOpen } from "@/lib/queries/election";
import { formatJakartaDateTime } from "@/lib/datetime";

export const metadata = {
  title: "Hasil Pemilihan",
};

export const dynamic = "force-dynamic";

function AdminInterimResults({ results }: { results: Awaited<ReturnType<typeof getElectionResults>> }) {
  const sorted = [...results.perCandidate].sort(
    (a, b) => b.voteCount - a.voteCount,
  );
  const leader = sorted[0];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Pemilih", value: results.totalVoters },
          {
            label: "Partisipasi",
            value: `${results.turnoutPercent}% (${results.totalVotes} dari ${results.totalVoters} Orang)`,
          },
          { label: "Suara Masuk", value: results.totalVotes },
        ].map((stat) => (
          <Card key={stat.label} className="min-h-24 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 break-words text-xl font-semibold text-zinc-900 sm:text-2xl">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {results.totalVotes === 0 ? (
        <EmptyState message="Belum ada suara masuk." />
      ) : (
        <Card className="overflow-hidden">
          {leader && (
            <p className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-center text-sm leading-relaxed text-zinc-500 sm:px-6">
              Sementara ini dipimpin oleh{" "}
              <span className="font-medium text-zinc-900">{leader.fullName}</span>{" "}
              dengan {leader.voteCount} suara.
            </p>
          )}
          {sorted.map((candidate, index) => (
            <div key={candidate.id} className="grid grid-cols-[28px_40px_minmax(0,1fr)_48px] items-center gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:grid-cols-[28px_40px_minmax(0,1fr)_60px] sm:gap-4 sm:px-6">
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

              <span className="text-right text-sm text-zinc-500">
                {candidate.percent}%
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export default async function AdminResultsPage() {
  await requireAdmin();

  const election = await getActiveElection();
  const canOpenManualResults = Boolean(
    election &&
      election.status === "closed" &&
      election.startsAt <= new Date(),
  );
  const openResults = await isResultsOpen(election);
  const results = await getElectionResults();

  if (!openResults) {
    const publicationStatus = election?.resultsPublicationMode === "manual"
      ? "Belum dipublikasikan"
      : election?.status !== "closed"
      ? "Menunggu pemilihan ditutup"
      : "Menunggu jadwal publikasi";
    const statusDescription = election?.resultsPublicationMode === "manual"
      ? "Hasil sementara hanya dapat dilihat admin sampai hasil dibuka untuk publik."
      : election
      ? `${election.status !== "closed" ? "Hasil dipublikasikan setelah pemilihan ditutup. Jadwal: " : "Hasil akan dibuka otomatis pada "}${formatJakartaDateTime(election.resultsOpenAt ?? election.endsAt)}.`
      : "Jadwal publikasi belum tersedia.";

    return (
      <section className="flex flex-col gap-6">
        <PageHeader
          title="Hasil Pemilihan"
          description="Pengaturan publikasi hasil pemilihan"
        />
        <ResultsRefresh
          publicationStatus={publicationStatus}
          statusDescription={statusDescription}
          action={election?.resultsPublicationMode === "manual" ? (
            <form action={setManualResultsStatusAction}>
              <input type="hidden" name="status" value="open" />
              <FormSubmitButton
                disabled={!canOpenManualResults}
                pendingText="Membuka hasil..."
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Unlock aria-hidden className="size-4" />
                Buka Hasil untuk Publik
              </FormSubmitButton>
              {!canOpenManualResults && (
                <p className="mt-1 text-right text-xs text-zinc-500">
                  {election.startsAt > new Date()
                    ? "Belum dimulai."
                    : election.status === "open"
                    ? "Tutup pemilihan terlebih dahulu."
                    : "Pemilihan harus ditutup."}
                </p>
              )}
            </form>
          ) : undefined}
        />

        <AdminInterimResults results={results} />
      </section>
    );
  }

  const sorted = [...results.perCandidate].sort(
    (a, b) => b.voteCount - a.voteCount,
  );
  const leader = sorted[0];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Hasil Pemilihan"
        description="Rekap suara secara real-time."
        action={
          <form action={resetResultsAction}>
            <ConfirmSubmitButton
              message="Hapus SEMUA suara? Tindakan ini tidak bisa dibatalkan."
              pendingText="Mereset hasil..."
              className="flex items-center gap-1.5 rounded-md border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <RotateCcw aria-hidden className="size-4" />
              Reset Hasil
            </ConfirmSubmitButton>
          </form>
        }
      />

      <ResultsRefresh
        publicationStatus="Sudah dipublikasikan"
        statusDescription="Hasil saat ini sudah dapat dilihat oleh publik. Rekap tetap diperbarui secara otomatis."
      />

      {election?.resultsPublicationMode === "manual" && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Publikasi manual sedang aktif
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Hasil saat ini dapat dilihat oleh publik.
            </p>
          </div>
          <form action={setManualResultsStatusAction}>
            <input type="hidden" name="status" value="closed" />
            <ConfirmSubmitButton
              message="Tutup hasil untuk publik? Admin masih dapat melihat rekap ini."
              pendingText="Menutup hasil..."
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 px-3.5 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <Lock aria-hidden className="size-4" />
              Tutup Hasil untuk Publik
            </ConfirmSubmitButton>
          </form>
        </Card>
      )}

       <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[{
          label: "Total Pemilih",
          value: results.totalVoters,
        }, {
          label: "Partisipasi",
          value: `${results.turnoutPercent}% (${results.totalVotes} dari ${results.totalVoters} Orang)`,
        }, {
          label: "Suara Masuk",
          value: results.totalVotes,
        }].map((stat) => (
          <Card key={stat.label} className="min-h-24 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 break-words text-xl font-semibold text-zinc-900 sm:text-2xl">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {results.totalVotes === 0 ? (
        <EmptyState message="Belum ada suara masuk." />
      ) : (
        <Card className="overflow-hidden">
          {leader && leader.voteCount > 0 && (
            <p className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-center text-sm leading-relaxed text-zinc-500 sm:px-6">
              Sementara ini dipimpin oleh{" "}
              <span className="font-medium text-zinc-900">{leader.fullName}</span>{" "}
              dengan {leader.voteCount} suara.
            </p>
          )}
          {sorted.map((candidate, index) => (
            <div key={candidate.id} className="grid grid-cols-[28px_40px_minmax(0,1fr)_48px] items-center gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:grid-cols-[28px_40px_minmax(0,1fr)_60px] sm:gap-4 sm:px-6">
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

              <span className="text-right text-sm text-zinc-500">
                {candidate.percent}%
              </span>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
