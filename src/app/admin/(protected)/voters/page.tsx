import { RotateCcw, Trash, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

import { ConfirmSubmitButton, Collapsible } from "@/components/admin/election-form";
import { VoterListControls } from "@/components/admin/voter-list-controls";
import {
  ResetVoteButton,
  VoterForm,
  VoterImportForm,
} from "@/components/admin/voter-forms";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import {
  deleteVoterAction,
  resetVoterVoteAction,
} from "@/lib/actions/voters";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAllPlacements } from "@/lib/queries/placements";
import {
  getVoterListCounts,
  getVotersWithVoteStatus,
} from "@/lib/queries/voters";

export const metadata = {
  title: "Atur Para Pemilih",
};

const pageSizeOptions = [20, 40, 60, 80, 100] as const;

export default async function AdminVotersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    placementId?: string;
    pageSize?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q ?? "";
  const placementId = params.placementId ?? "";
  const pageSizeParam = Number(params.pageSize);
  const pageSize = pageSizeOptions.includes(
    pageSizeParam as (typeof pageSizeOptions)[number],
  )
    ? pageSizeParam
    : 20;
  const requestedPage = Number(params.page);
  const sort = params.sort === "desc" ? "desc" : "asc";

  // Halaman admin TIDAK di-cache: selalu data terbaru per request.
  const [placements, counts] = await Promise.all([
    getAllPlacements(),
    getVoterListCounts({ search: q, placementId }),
  ]);
  const totalPages = Math.max(1, Math.ceil(counts.total / pageSize));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;
  const voters = await getVotersWithVoteStatus({
    search: q,
    placementId,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    sort,
  });

  const placementOptions = placements.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  const totalVoters = counts.total;
  const votedCount = counts.voted;
  const unvotedCount = totalVoters - votedCount;

  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (placementId) query.set("placementId", placementId);
    query.set("pageSize", String(pageSize));
    query.set("sort", sort);
    query.set("page", String(page));
    return `?${query.toString()}`;
  };

  return (
    <section className="flex flex-col gap-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Manajemen Pemilih"
          description="Kelola daftar pemilih terdaftar, status voting, serta pengaturan pemilih secara real-time."
        />

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-4 shadow-sm border border-zinc-200/80 bg-white">
            <div className="rounded-lg bg-zinc-100 p-2.5 text-zinc-700">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Pemilih
              </p>
              <p className="text-xl font-semibold text-zinc-900">{totalVoters}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4 shadow-sm border border-zinc-200/80 bg-white">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Sudah Memilih
              </p>
              <p className="text-xl font-semibold text-zinc-900">{votedCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4 shadow-sm border border-zinc-200/80 bg-white">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Belum Memilih
              </p>
              <p className="text-xl font-semibold text-zinc-900">{unvotedCount}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Form Tambah Pemilih & Import */}
      <Card className="border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Tambah Pemilih Baru</h3>
        <VoterForm placements={placementOptions} />
      </Card>

      <Collapsible title="Import Pemilih Massal">
        <VoterImportForm placements={placementOptions} />
      </Collapsible>

      {/* Tabel Data Pemilih */}
      <Card className="overflow-hidden border border-zinc-200 bg-white shadow-sm">
        {/* Filter */}
        <div className="border-b border-zinc-200 bg-white p-4">
          <VoterListControls
            key={`${q}:${placementId}:${sort}:${pageSize}`}
            search={q}
            placementId={placementId}
            sort={sort}
            pageSize={pageSize}
            placements={placementOptions}
          />
        </div>

        {totalVoters === 0 ? (
          <div className="p-12">
            <EmptyState
              message={
                q || placementId
                  ? "Tidak ada pemilih yang sesuai dengan kriteria pencarian atau filter Anda."
                  : "Belum ada data pemilih. Gunakan form di atas untuk menambahkan atau mengimpor data."
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70">
                    {/* Nama */}
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Nama
                    </th>

                    {/* Tipe */}
                    <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Tipe
                    </th>

                    {/* Penempatan */}
                    <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Penempatan
                    </th>

                    {/* Status */}
                    <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Status
                    </th>

                    {/* Aksi */}
                    <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {voters.map((voter) => (
                    <tr
                      key={voter.id}
                      className="group bg-white transition-colors hover:bg-zinc-50/60"
                    >
                      {/* Nama */}
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {voter.fullName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipe */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-medium text-zinc-600">
                          {voter.type === "student" ? "Siswa" : "Guru"}
                        </span>
                      </td>

                      {/* Penempatan */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                            {voter.placementName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          {voter.hasVoted ? (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                              <span
                                aria-hidden
                                className="size-1.5 rounded-full bg-emerald-500"
                              />
                              Sudah memilih
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-700">
                              <span
                                aria-hidden
                                className="size-1.5 rounded-full bg-amber-500"
                              />
                              Belum memilih
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {voter.hasVoted && (
                            <form action={resetVoterVoteAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={voter.id}
                              />

                              <ResetVoteButton
                                voterName={voter.fullName}
                              />
                            </form>
                          )}

                          <form action={deleteVoterAction}>
                            <input
                              type="hidden"
                              name="id"
                              value={voter.id}
                            />

                            <ConfirmSubmitButton
                              message={`Hapus pemilih "${voter.fullName}"?`}
                              className="inline-flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                              aria-label={`Hapus ${voter.fullName}`}
                            >
                              <Trash
                                aria-hidden
                                className="size-3.5"
                              />
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <nav
              aria-label="Navigasi halaman pemilih"
              className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-xs text-zinc-500">
                Menampilkan{" "}
                <span className="font-medium text-zinc-800">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                {"–"}
                <span className="font-medium text-zinc-800">
                  {Math.min(currentPage * pageSize, totalVoters)}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-zinc-800">
                  {totalVoters}
                </span>{" "}
                pemilih
              </p>

              <div className="flex items-center gap-2">
                <Link
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  href={pageHref(Math.max(1, currentPage - 1))}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    currentPage <= 1
                      ? "pointer-events-none border-zinc-200 bg-zinc-50 text-zinc-300"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  Sebelumnya
                </Link>

                <span className="min-w-20 text-center text-xs tabular-nums text-zinc-500">
                  {currentPage} / {totalPages}
                </span>

                <Link
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  href={pageHref(
                    Math.min(totalPages, currentPage + 1),
                  )}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    currentPage >= totalPages
                      ? "pointer-events-none border-zinc-200 bg-zinc-50 text-zinc-300"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  Berikutnya
                </Link>
              </div>
            </nav>
          </>
        )}
      </Card>


      {/* Informasi Bantuan */}
      {votedCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-800">
          <RotateCcw aria-hidden className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            Fitur <strong className="font-semibold">Reset Pilihan</strong> digunakan untuk menghapus data suara pemilih tertentu agar mereka dapat memberikan suara kembali (misalnya apabila terjadi kesalahan input atau kendala sistem saat pemilihan).
          </p>
        </div>
      )}
    </section>
  );
}