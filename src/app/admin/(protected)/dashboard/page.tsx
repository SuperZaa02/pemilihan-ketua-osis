import { ShieldCheck } from "lucide-react";

import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = {
  title: "Dashboard | Pemilihan Ketua OSIS",
};

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const placeholderCards = [
    { title: "Kandidat", description: "Kelola data calon Ketua OSIS." },
    { title: "Pemilih", description: "Kelola daftar pemilih terdaftar." },
    { title: "Pengaturan", description: "Atur periode & aturan pemilihan." },
    { title: "Hasil", description: "Lihat hasil pemilihan secara real-time." },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Selamat datang, {session.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Panel administrasi sistem pemilihan Ketua OSIS.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="text-sm">
          <p className="font-medium text-emerald-800">Autentikasi aktif</p>
          <p className="mt-0.5 text-emerald-700">
            Anda masuk sebagai{" "}
            <span className="font-medium">{session.role === "super_admin" ? "Super Admin" : "Admin"}</span>.
            Fondasi dashboard siap dikembangkan ke modul berikutnya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {placeholderCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-medium text-zinc-900">{card.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{card.description}</p>
            <p className="mt-3 inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              Segera hadir
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
