import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { VoterLoginForm } from "@/components/vote/voter-login-form";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getCachedActiveElection } from "@/lib/queries/cached";
import { getPlacementsWithVotingStatus } from "@/lib/queries/placements";
import { CirclePause } from "lucide-react";

export const metadata: Metadata = {
  title: "Voting",
};

/**
 * Halaman publik PAKAI CACHE — TANPA force-dynamic.
 * Cache di-revalidate lewat updateTag("election") saat admin
 * membuka/menutup/mengubah pemilihan. getVoterSession() membaca cookies,
 * yang otomatis membuat request ini dynamic tanpa perlu force-dynamic.
 */
const ERROR_MESSAGES: Record<string, string> = {
  "not-available":
    "Belum ada pemilihan yang tersedia. Silakan hubungi panitia.",
  session: "Sesi Anda berakhir. Silakan pilih kelas dan nama kembali.",
  "not-found": "Data pemilih tidak ditemukan. Silakan coba lagi.",
};

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Sudah login? langsung ke daftar kandidat.
  const voterSession = await getVoterSession();
  if (voterSession) {
    redirect("/vote/candidates");
  }

  const [election, placements] = await Promise.all([
    getCachedActiveElection(),
    getPlacementsWithVotingStatus(),
  ]);

  if (!election || election.status !== "open") {
    const startTimestamp = election?.startsAt.getTime() ?? NaN;
    const hasStarted = Number.isFinite(startTimestamp) && startTimestamp <= Date.now();
    const isPaused = election?.status === "closed" && hasStarted;
    const hasCountdown = Boolean(
      election &&
        Number.isFinite(startTimestamp) &&
        startTimestamp > Date.now(),
    );

    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          {isPaused ? (
            <>
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600" aria-hidden="true">
                <CirclePause className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-semibold text-zinc-900">Pemilihan dijeda oleh admin</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Pemungutan suara sedang dijeda oleh admin. Silakan cek kembali nanti.
              </p>
            </>
          ) : hasCountdown ? (
            <>
              <p className="text-sm font-medium text-zinc-500">{election?.name}</p>
              <h1 className="mt-2 text-lg font-semibold text-zinc-900">
                Pemilihan dimulai dalam
              </h1>
              <p
                id="election-countdown"
                className="font-mono text-3xl font-semibold tracking-tight text-indigo-600"
                aria-live="polite"
              >
                --:--:--
              </p>
              <p className="mt-2 text-sm text-zinc-500">Silakan kembali saat waktu pemilihan tiba.</p>
              <Script id="election-countdown-script" strategy="afterInteractive">
                {`(() => {
                  const target = ${startTimestamp};
                  const element = document.getElementById("election-countdown");
                  if (!element) return;
                  const update = () => {
                    const remaining = Math.max(0, target - Date.now());
                    const hours = Math.floor(remaining / 3600000);
                    const minutes = Math.floor((remaining % 3600000) / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);
                    element.textContent = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
                    if (remaining === 0) element.textContent = "Segera dimulai";
                  };
                  update();
                  window.setInterval(update, 1000);
                })();`}
              </Script>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-zinc-900">
                Pemungutan suara belum dibuka
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                {election
                  ? "Pemilihan belum dimulai. Silakan kembali pada jadwal yang ditentukan."
                  : "Belum ada pemilihan yang dijadwalkan. Silakan hubungi panitia."}
              </p>
            </>
          )}
        </div>
      </main>
    );
  }

  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? decodeURIComponent(error)
    : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {election.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Pilih kelas dan nama Anda untuk memulai
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {errorMessage && (
            <p
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          <VoterLoginForm
            allowedPlacements={election.allowedPlacements}
            placements={placements}
          />
        </div>
      </div>
    </main>
  );
}
