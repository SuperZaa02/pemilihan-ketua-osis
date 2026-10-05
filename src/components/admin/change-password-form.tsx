"use client";

import { CircleAlert, CircleCheck, KeyRound } from "lucide-react";
import { useActionState } from "react";

import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/lib/actions/auth";

const initialState: ChangePasswordState = { error: null, success: null };

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      {state.error && (
        <p
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          role="status"
        >
          <CircleCheck aria-hidden className="size-4 shrink-0" />
          {state.success}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-900">
          Password Saat Ini
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-zinc-900">
          Password Baru
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-xs text-zinc-600">Minimal 8 karakter.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-900">
          Konfirmasi Password Baru
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-10 w-fit items-center gap-2 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        <KeyRound aria-hidden className="size-4" />
        {isPending ? "Menyimpan..." : "Ubah Password"}
      </button>
    </form>
  );
}
