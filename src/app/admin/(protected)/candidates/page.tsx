import Image from "next/image";

import { CandidateForm } from "@/components/admin/candidate-form";
import {
  Collapsible,
  ConfirmSubmitButton,
} from "@/components/admin/election-form";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import {
  deleteCandidateAction,
  toggleCandidateStatusAction,
} from "@/lib/actions/candidates";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAllCandidates } from "@/lib/queries/candidates";

export const metadata = {
  title: "Kandidat | Pemilihan Ketua OSIS",
};

export default async function AdminCandidatesPage() {
  await requireAdmin();
  const candidates = await getAllCandidates();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Kandidat"
        description="Kelola data calon Ketua OSIS."
      />

      <Collapsible title="Tambah Kandidat Baru">
        <CandidateForm />
      </Collapsible>

      {candidates.length === 0 ? (
        <EmptyState message="Belum ada kandidat. Tambahkan kandidat pertama di atas." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  {candidate.photoUrl ? (
                    <Image
                      src={candidate.photoUrl}
                      alt={candidate.fullName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-semibold text-zinc-400">
                      {candidate.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium text-zinc-900">
                      {candidate.fullName}
                    </h2>
                    <StatusBadge status={candidate.status} />
                  </div>
                  <p className="text-sm text-zinc-500">{candidate.className}</p>
                </div>
              </div>

              {candidate.bio && (
                <p className="line-clamp-2 text-sm text-zinc-600">
                  {candidate.bio}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Visi
                  </p>
                  <p className="mt-1 line-clamp-3 text-zinc-700">
                    {candidate.vision}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Misi
                  </p>
                  <p className="mt-1 line-clamp-3 text-zinc-700">
                    {candidate.mission}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                <form action={toggleCandidateStatusAction}>
                  <input type="hidden" name="id" value={candidate.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    {candidate.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>

                <form action={deleteCandidateAction}>
                  <input type="hidden" name="id" value={candidate.id} />
                  <ConfirmSubmitButton
                    message={`Hapus kandidat "${candidate.fullName}"?`}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Hapus
                  </ConfirmSubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
