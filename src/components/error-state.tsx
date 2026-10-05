"use client";

import Link from "next/link";
import { CircleAlert, RotateCw } from "lucide-react";

type ErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorState({ error, reset }: ErrorStateProps) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <CircleAlert aria-hidden="true" size={24} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
          Terjadi Kesalahan Internal
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Maaf, terjadi masalah saat memuat halaman. Silakan coba lagi.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-zinc-500">
            Kode referensi: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            onClick={reset}
            type="button"
          >
            <RotateCw aria-hidden="true" size={16} />
            Coba lagi
          </button>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            href="/vote"
          >
            Kembali ke voting
          </Link>
        </div>
      </section>
    </main>
  );
}
