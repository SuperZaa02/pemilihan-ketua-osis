"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    days > 0 ? `${days} hari` : null,
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function ResultsCountdown({ opensAt }: { opensAt: string }) {
  const router = useRouter();
  const target = new Date(opensAt).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (target <= Date.now()) {
      router.refresh();
      return;
    }

    const interval = window.setInterval(() => {
      const nextRemaining = Math.max(0, target - Date.now());
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        window.clearInterval(interval);
        router.refresh();
      }
    }, 1000);
    const initialUpdate = window.setTimeout(
      () => setRemaining(Math.max(0, target - Date.now())),
      0,
    );

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initialUpdate);
    };
  }, [router, target]);

  return (
    <p
      className="mt-4 font-mono text-2xl font-semibold tracking-tight text-indigo-600"
      aria-label={
        remaining === null
          ? "Menghitung waktu publikasi"
          : `Waktu tersisa ${formatRemaining(remaining)}`
      }
    >
      {remaining === null ? "Menghitung..." : formatRemaining(remaining)}
    </p>
  );
}
