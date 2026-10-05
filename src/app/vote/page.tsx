import Link from "next/link";
import { Vote } from "lucide-react";

export const metadata = {
  title: "Vote | Pemilihan Ketua OSIS",
};

/**
 * Halaman pemilih — fokus tahap ini adalah fondasi (database + auth admin).
 * Alur pemilih (identitas → validasi eligibility → voting) menyusul.
 */
export default function VotePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-zinc-900">
          <Vote aria-hidden className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Pemungutan suara belum dibuka
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Halaman pemilih sedang disiapkan. Silakan kembali lagi nanti.
        </p>
        <Link
          href="/"
          className="mt-8 text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          Kembali ke halaman utama
        </Link>
      </div>
    </main>
  );
}
