import Image from "next/image";
import { Pencil } from "lucide-react";

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
import { getAllCandidates, getCandidateById } from "@/lib/queries/candidates";
import { getAllPlacements } from "@/lib/queries/placements";

export const metadata = {
  title: "Atur Para Kandidat",
};

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();
  const { edit } = await searchParams;

  // Halaman admin TIDAK di-cache: selalu data terbaru per request.
  const [candidates, placements, editing] = await Promise.all([
    getAllCandidates(),
    getAllPlacements(),
    edit ? getCandidateById(edit) : Promise.resolve(null),
  ]);

  const placementOptions = placements.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  const noPlacements = placements.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Kandidat"
        description="Kelola data calon Ketua OSIS."
      />

      {noPlacements ? (
        <EmptyState message="Belum ada kelas terdaftar. Buat kelas dulu di halaman Pengaturan → tab Kelas, lalu tambahkan kandidat." />
      ) : (
        <Collapsible
          title={editing
            ? `Edit Kandidat: ${editing.fullName}`
            : "Tambah Kandidat Baru"}
          defaultOpen={Boolean(editing)}
        >
          <CandidateForm
            candidate={editing ?? undefined}
            placements={placementOptions}
          />
        </Collapsible>
      )}

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
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-semibold text-zinc-500">
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
                  <p className="text-sm text-zinc-600">
                    {candidate.placementName}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Program Kerja
                </p>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-zinc-700">
                  {candidate.programKerja}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Visi
                  </p>
                  <p className="mt-1 line-clamp-3 text-zinc-800">
                    {candidate.vision}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Misi
                  </p>
                  <p className="mt-1 line-clamp-3 text-zinc-800">
                    {candidate.mission}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                <a
                  href={`/admin/candidates?edit=${candidate.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  <Pencil aria-hidden className="size-3.5" />
                  Edit
                </a>

                <form action={toggleCandidateStatusAction}>
                  <input type="hidden" name="id" value={candidate.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
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
