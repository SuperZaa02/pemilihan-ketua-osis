"use client";

import { CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function ResultsRefresh({
  publicationStatus,
  statusDescription,
  action,
}: {
  publicationStatus: string;
  statusDescription: string;
  action?: ReactNode;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isPublished = publicationStatus === "Sudah dipublikasikan";

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [router]);

  function refreshNow() {
    setIsRefreshing(true);
    router.refresh();
    window.setTimeout(() => setIsRefreshing(false), 600);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${isPublished ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          {isPublished ? <CheckCircle2 className="size-5" aria-hidden /> : <Clock3 className="size-5" aria-hidden />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-zinc-900">Status publikasi</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {publicationStatus}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-zinc-600">{statusDescription}</p>
          <p className="mt-1.5 text-xs text-zinc-400">Diperbarui otomatis setiap 5 detik</p>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
        {action}
        <button
          type="button"
          onClick={refreshNow}
          disabled={isRefreshing}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
          {isRefreshing ? "Memuat..." : "Refresh sekarang"}
        </button>
      </div>
    </div>
  );
}
