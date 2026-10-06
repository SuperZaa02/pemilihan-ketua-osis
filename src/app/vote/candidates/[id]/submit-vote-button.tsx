"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function VoteConfirmationControls({
  candidateName,
}: {
  candidateName: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const { pending } = useFormStatus();

  return (
    <>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition-colors hover:bg-white/[0.08] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white/50">
        <input
          type="checkbox"
          name="confirm"
          required
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/30 bg-transparent accent-white"
        />

        <span className="text-xs leading-5 text-zinc-300 sm:text-sm">
          Saya menyatakan memilih{" "}
          <strong className="font-semibold text-white">{candidateName}</strong>{" "}
          secara sadar, jujur, dan tanpa paksaan.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending || !confirmed}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 shadow-sm transition-all hover:bg-zinc-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mengirim suara...
          </>
        ) : (
          "Konfirmasi & Kirim Suara"
        )}
      </button>
    </>
  );
}
