import Image from "next/image";
import { Lock, RotateCcw, Unlock } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/admin/election-form";
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

export default async function AdminResultsPage() {
  await requireAdmin();

  const election = await getActiveElection();
  const canOpenManualResults = Boolean(
    election &&
      election.status === "closed" &&
      election.startsAt <= new Date(),
  );
  const openResults = await isResultsOpen(election);

  if (!openResults) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader
          title="Hasil Pemilihan"
          description="Pengaturan publikasi hasil pemilihan"
        />
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <RotateCcw className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {election?.resultsPublicationMode === "manual"
              ? "Hasil Menunggu Dibuka Admin"
              : "Menunggu Publikasi Otomatis"}
          </h2>
          {election?.resultsPublicationMode === "manual" ? (
            <p className="mt-2 text-sm text-zinc-600">
              {election.status === "open"
                ? "Tutup pemilihan terlebih dahulu sebelum membuka hasil untuk publik."
                : "Publik belum dapat melihat hasil sampai admin membukanya secara manual."}
            </p>
          ) : election ? (
            <p className="mt-2 text-sm text-zinc-600">
              {election.status !== "closed"
                ? "Hasil hanya akan dipublikasikan setelah jadwal tercapai dan status pemilihan ditutup. Jadwal: "
                : "Hasil akan dibuka otomatis pada "}
              {formatJakartaDateTime(election.resultsOpenAt ?? election.endsAt)}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              Jadwal pemilihan belum tersedia.
            </p>
          )}
          {election?.resultsPublicationMode === "manual" && (
            <form action={setManualResultsStatusAction}>
              <input type="hidden" name="status" value="open" />
              <FormSubmitButton
                disabled={!canOpenManualResults}
                pendingText="Membuka hasil..."
                className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Unlock aria-hidden className="size-4" />
                Buka Hasil untuk Publik
              </FormSubmitButton>
              {!canOpenManualResults && (
                <p className="mt-2 text-xs text-zinc-500">
                  {election.startsAt > new Date()
                    ? "Hasil belum dapat dibuka sebelum pemilihan dimulai."
                    : election.status === "open"
                    ? "Tutup pemilihan terlebih dahulu untuk membuka publikasi hasil."
                    : "Pemilihan harus berstatus ditutup sebelum hasil dapat dibuka."}
                </p>
              )}
            </form>
          )}
        </Card>
      </section>
    );
  }

  const results = await getElectionResults();

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          <Card key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {results.totalVotes === 0 ? (
        <EmptyState message="Belum ada suara masuk." />
      ) : (
        <Card className="flex flex-col divide-y divide-zinc-100">
          {leader && leader.voteCount > 0 && (
            <p className="px-4 py-3 text-center text-sm leading-relaxed text-zinc-500">
              Sementara ini dipimpin oleh{" "}
              <span className="font-medium text-zinc-900">{leader.fullName}</span>{" "}
              dengan {leader.voteCount} suara.
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
    </section>
  );
}