"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useTransition } from "react";

import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={logoutAction}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => logoutAction());
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        title="Keluar"
      >
        {isPending ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : (
          <LogOut aria-hidden className="size-4" />
        )}
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </form>
  );
}
