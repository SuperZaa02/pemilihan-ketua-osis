import { Search, Trash } from "lucide-react";

import { Collapsible, ConfirmSubmitButton } from "@/components/admin/election-form";
import { VoterForm, VoterImportForm } from "@/components/admin/voter-forms";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { deleteVoterAction } from "@/lib/actions/voters";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getVotersWithVoteStatus } from "@/lib/queries/voters";

export const metadata = {
  title: "Pemilih | Pemilihan Ketua OSIS",
};

export default async function AdminVotersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const voters = await getVotersWithVoteStatus({ search: q });
  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Pemilih"
        description={`${totalVoters} pemilih terdaftar · ${votedCount} sudah memilih`}
      />

      <Collapsible title="Tambah Pemilih">
        <VoterForm />
      </Collapsible>

      <Collapsible title="Import Massal">
        <VoterImportForm />
      </Collapsible>

      <Card className="flex flex-col">
        <form className="flex gap-2 border-b border-zinc-100 p-4">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cari nama atau kelas..."
              className="h-9 w-full rounded-md border border-zinc-300 pl-9 pr-3 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Cari
          </button>
        </form>

        {voters.length === 0 ? (
          <div className="p-6">
            <EmptyState message="Belum ada pemilih. Tambahkan atau import pemilih di atas." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Penempatan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr
                    key={voter.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {voter.fullName}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {voter.type === "student" ? "Siswa" : "Guru"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {voter.placement}
                    </td>
                    <td className="px-4 py-3">
                      {voter.hasVoted ? (
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                          Sudah memilih
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Belum memilih
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteVoterAction}>
                        <input type="hidden" name="id" value={voter.id} />
                        <ConfirmSubmitButton
                          message={`Hapus pemilih "${voter.fullName}"?`}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash aria-hidden className="inline size-3.5" />
                          <span className="ml-1">Hapus</span>
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
