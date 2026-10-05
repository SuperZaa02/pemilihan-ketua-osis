import { Hourglass, Lock, Play } from "lucide-react";

import {
  ElectionForm,
} from "@/components/admin/election-form";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { setElectionStatusAction } from "@/lib/actions/election";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getActiveElection } from "@/lib/queries/election";

export const metadata = {
  title: "Pengaturan Pemilihan | Pemilihan Ketua OSIS",
};

export default async function AdminElectionPage() {
  await requireAdmin();
  const election = await getActiveElection();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan Pemilihan"
        description="Atur periode, target pemilih, dan status pemilihan."
      />

      {election && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-zinc-900">{election.name}</h2>
              <StatusBadge status={election.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(election.startsAt)}
              {" — "}
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(election.endsAt)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Kelas diizinkan: {election.allowedClasses.join(", ") || "-"}
              {election.allowTeachers ? " · Guru boleh memilih" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {election.status !== "open" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="open" />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Play aria-hidden className="size-4" />
                  Buka Pemilihan
                </button>
              </form>
            )}
            {election.status === "open" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="closed" />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  <Lock aria-hidden className="size-4" />
                  Tutup Pemilihan
                </button>
              </form>
            )}
            {election.status !== "draft" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="draft" />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <Hourglass aria-hidden className="size-4" />
                  Kembalikan ke Draft
                </button>
              </form>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <ElectionForm election={election} />
      </Card>
    </section>
  );
}
