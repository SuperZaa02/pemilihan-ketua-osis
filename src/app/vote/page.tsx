import Script from "next/script";
import { redirect } from "next/navigation";
import { LinkToResultButton } from "@/components/vote/link-to-result-button";

import { VoterLoginForm } from "@/components/vote/voter-login-form";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getCachedActiveElection } from "@/lib/queries/cached";
import { getPlacementsWithVotingStatus } from "@/lib/queries/placements";
import { CheckCircle2, CirclePause, Clock3 } from "lucide-react";

export const metaMetadata = {
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

  const [election, placements] = await Promise.all([
    getCachedActiveElection(),
    getPlacementsWithVotingStatus(),
  ]);

  const now = new Date();
  const hasFinished = Boolean(election && election.endsAt <= now);
  const hasStarted = Boolean(election && election.startsAt <= now);
  const isPaused = Boolean(
    election &&
      election.status === "closed" &&
      hasStarted &&
      !hasFinished,
  );
  const isNotOpened = Boolean(
    election &&
      election.status !== "open" &&
      !isPaused &&
      !hasFinished,
  );

  if (!election || election.status !== "open") {
    const startTimestamp = election?.startsAt
      ? new Date(election.startsAt).getTime()
      : NaN;

    const hasCountdown = Boolean(
      election &&
        !hasStarted &&
        Number.isFinite(startTimestamp) &&
        startTimestamp > now.getTime(),
    );

    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          {hasFinished ? (
            <>
              <div
                className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
                aria-hidden="true"
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-semibold text-zinc-900">
                Pemilihan sudah selesai
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Waktu pemungutan suara telah berakhir. Lihat hasil pemilihan
                melalui tautan di bawah.
              </p>
            </>
          ) : isPaused ? (
            <>
              <div
                className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600"
                aria-hidden="true"
              >
                <CirclePause className="h-6 w-6" />
              </div>

              <h1 className="text-lg font-semibold text-zinc-900">
                Pemilihan dijeda oleh admin
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Pemungutan suara sedang dijeda oleh admin. Silakan cek kembali
                nanti.
              </p>
            </>
          ) : hasCountdown ? (
            <>
              <div
                className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
                aria-hidden="true"
              >
                <Clock3 className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-500">
                {election?.name}
              </p>

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

                    element.textContent = [hours, minutes, seconds]
                      .map((value) => String(value).padStart(2, "0"))
                      .join(":");

                    if (remaining === 0) {
                      element.textContent = "Segera dimulai";
                    }
                  };

                  update();
                  window.setInterval(update, 1000);
                })();`}
              </Script>

              <p className="mt-2 text-sm text-zinc-500">
                Silakan kembali saat waktu pemilihan tiba.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-zinc-900">
                {isNotOpened
                  ? "Pemilihan belum dibuka"
                  : "Belum ada pemilihan"}
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {election
                  ? "Pemilihan belum dimulai. Silakan kembali pada jadwal yang ditentukan."
                  : "Belum ada pemilihan yang dijadwalkan. Silakan hubungi panitia."}
              </p>
            </>
          )}
          <LinkToResultButton />
        </div>
      </main>
    );
  }

  // Jika pemilihan belum aktif atau sudah selesai, tampilkan statusnya dulu.
  const voterSession = await getVoterSession();
  if (voterSession) {
    redirect("/vote/candidates");
  }

  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? decodeURIComponent(error)
    : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="grid w-full max-w-4xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <header className="text-center lg:text-left">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {election.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Pilih kelas dan nama Anda untuk memulai
          </p>
          <div className="flex justify-center lg:justify-start">
            <LinkToResultButton />
          </div>
        </header>

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