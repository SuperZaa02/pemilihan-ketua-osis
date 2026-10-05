"use client";

import { LoaderCircle, LogIn, TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium">
          Username atau Email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="admin"
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden className="size-4" />
        )}
        {isPending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
