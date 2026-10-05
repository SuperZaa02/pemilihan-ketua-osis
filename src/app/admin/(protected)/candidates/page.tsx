import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = {
  title: "Kandidat | Pemilihan Ketua OSIS",
};

export default async function AdminCandidatesPage() {
  await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Kandidat
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola data calon Ketua OSIS.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Kembali ke dashboard
        </Link>
      </header>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-sm text-zinc-500">
          Modul manajemen kandidat akan diimplementasikan pada tahap berikutnya.
        </p>
      </div>
    </section>
  );
}
