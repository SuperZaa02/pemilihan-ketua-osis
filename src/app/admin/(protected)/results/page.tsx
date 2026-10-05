import Image from "next/image";
import { RotateCcw } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/admin/election-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { resetResultsAction } from "@/lib/actions/election";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getElectionResults } from "@/lib/queries/results";

export const metadata = {
  title: "Hasil | Pemilihan Ketua OSIS",
};

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  await requireAdmin();
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
              className="flex items-center gap-1.5 rounded-md border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <RotateCcw aria-hidden className="size-4" />
              Reset Hasil
            </ConfirmSubmitButton>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Pemilih", value: results.totalVoters },
          { label: "Suara Masuk", value: results.totalVotes },
          { label: "Partisipasi", value: `${results.turnoutPercent}%` },
          {
            label: "Suara Guru",
            value: results.teacherVotes,
          },
        ].map((stat) => (
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

      {leader && leader.voteCount > 0 && (
        <p className="text-center text-sm text-zinc-500">
          Sementara ini dipimpin oleh{" "}
          <span className="font-medium text-zinc-900">{leader.fullName}</span>{" "}
          dengan {leader.voteCount} suara.
        </p>
      )}
    </section>
  );
}
