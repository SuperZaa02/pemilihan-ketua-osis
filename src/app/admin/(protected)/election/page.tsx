import { Check, Lock, Play } from "lucide-react";

import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  Collapsible,
  ConfirmSubmitButton,
  ElectionForm,
  PlacementManager,
} from "@/components/admin/election-form";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import {
  deleteAllElectionDataAction,
  setElectionStatusAction,
} from "@/lib/actions/election";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getActiveElection } from "@/lib/queries/election";
import { getPlacementsWithUsage } from "@/lib/queries/placements";
import { formatJakartaDateTime } from "@/lib/datetime";

export const metadata = {
  title: "Pengaturan Pemilihan",
};

export default async function AdminElectionPage() {
  await requireAdmin();
  // Halaman admin TIDAK di-cache: selalu data terbaru per request.
  const [election, placementsWithUsage] = await Promise.all([
    getActiveElection(),
    getPlacementsWithUsage(),
  ]);

  const placementOptions = placementsWithUsage.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan"
        description="Atur pemilihan, kelola daftar kelas, dan akun admin."
      />

      {election && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-zinc-900">{election.name}</h2>
              <StatusBadge status={election.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {formatJakartaDateTime(election.startsAt)}
              {" — "}
              {formatJakartaDateTime(election.endsAt)}
            </p>
            <p
              className="mt-1 line-clamp-2 text-sm text-zinc-600"
              title={election.allowedPlacements.join(", ")}
            >
              Penempatan yang diizinkan: {placementOptions.length > 0 &&
              placementOptions.every((placement) =>
                election.allowedPlacements.includes(placement.name),
              )
                ? "Semuanya"
                : election.allowedPlacements.join(", ") || "-"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {election.status !== "open" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="open" />
                <FormSubmitButton
                  pendingText="Memproses..."
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Play aria-hidden className="size-4" />
                  Buka Pemilihan
                </FormSubmitButton>
              </form>
            )}
            {election.status === "open" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="closed" />
                <FormSubmitButton
                  pendingText="Memproses..."
                  className="flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  <Lock aria-hidden className="size-4" />
                  Tutup Pemilihan
                </FormSubmitButton>
              </form>
            )}
            {election.status !== "draft" && (
              <form action={setElectionStatusAction}>
                <input type="hidden" name="status" value="draft" />
                <FormSubmitButton
                  pendingText="Memproses..."
                  className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  <Check aria-hidden className="size-4" />
                  Selesaikan Pemilihan
                </FormSubmitButton>
              </form>
            )}
          </div>
        </Card>
      )}

      <Collapsible title="Pengaturan Pemilihan" defaultOpen>
        <ElectionForm election={election} placements={placementOptions} />
      </Collapsible>

      <Collapsible title="Daftar Kelas / Penempatan">
        <PlacementManager placements={placementsWithUsage} />
      </Collapsible>

      <Collapsible title="Ganti Password Admin">
        <ChangePasswordForm />
      </Collapsible>

      <Collapsible title="Zona Bahaya">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600">
            Menghapus <strong className="text-zinc-900">semua data pemilihan</strong>:
            seluruh suara, kandidat, dan pemilih dihapus permanen. Daftar kelas,
            pengaturan pemilihan, dan akun admin tidak ikut terhapus.
          </p>
          <form action={deleteAllElectionDataAction}>
            <ConfirmSubmitButton
              message="Hapus SEMUA suara, kandidat, dan pemilih? Tindakan ini tidak bisa dibatalkan."
              pendingText="Menghapus..."
              className="w-fit rounded-md border border-red-300 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Hapus Semua Data Pemilihan
            </ConfirmSubmitButton>
          </form>
        </div>
      </Collapsible>
    </section>
  );
}
