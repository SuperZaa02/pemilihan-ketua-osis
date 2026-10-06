"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitVoteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
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
  );
}
