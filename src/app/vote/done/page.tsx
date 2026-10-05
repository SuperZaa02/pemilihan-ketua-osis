import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terima Kasih",
};

export default function VoteDonePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-100">
          <CircleCheck aria-hidden className="size-6 text-emerald-600" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-900">
          Suara Anda berhasil dikirim
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Terima kasih telah berpartisipasi dalam pemilihan Ketua OSIS. Suara
          Anda bersifat rahasia dan telah tercatat.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Selesai
        </Link>
      </div>
    </main>
  );
}
