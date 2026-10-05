import { Vote } from "lucide-react";

export const metadata = {
  title: "Pemilihan Ketua OSIS",
  description:
    "Sistem pemilihan Ketua OSIS SMAN 10 Kota Bekasi — sederhana, cepat, dan aman.",
};

export default function LandingPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-zinc-900">
          <Vote aria-hidden className="size-7 text-white" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Pemilihan Ketua OSIS
        </h1>
        <p className="mt-3 text-zinc-500">
          SMAN 10 Kota Bekasi
        </p>

        <div className="mt-10 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-zinc-900">Pemungutan suara</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Alur pemilih (identitas → validasi → voting) sedang disiapkan.
            Halaman ini akan menjadi pintu masuk pemilih.
          </p>
        </div>

        <a
          href="/admin/login"
          className="mt-8 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          Login admin
        </a>
      </div>
    </main>
  );
}
