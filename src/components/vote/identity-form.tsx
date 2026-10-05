"use client";

import { CircleAlert, CircleCheck, UserRound } from "lucide-react";
import { useActionState } from "react";

import {
  confirmIdentityAction,
  identifyVoterAction,
  type IdentityState,
} from "@/lib/actions/vote";

const initialState: IdentityState = { error: null, matched: null };

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function IdentityForm({
  electionName,
  allowedClasses,
}: {
  electionName: string;
  allowedClasses: string[];
}) {
  const [state, formAction, isPending] = useActionState(
    identifyVoterAction,
    initialState,
  );

  return (
    <div className="flex flex-col gap-4">
      {state.error && (
        <p
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      {state.matched ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Data ditemukan</p>
              <p className="mt-0.5">
                {state.matched.fullName} —{" "}
                {state.matched.type === "student"
                  ? `Siswa ${state.matched.placement}`
                  : "Guru"}
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-600">
            Apakah Anda <strong>{state.matched.fullName}</strong>?
            Pastikan data ini benar — satu pemilih hanya bisa memberikan satu
            suara.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={confirmIdentityAction} className="flex-1">
              <input
                type="hidden"
                name="fullName"
                value={state.matched.fullName}
              />
              <input
                type="hidden"
                name="placement"
                value={state.matched.placement}
              />
              <button
                type="submit"
                className="h-10 w-full rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Ya, Lanjutkan Memilih
              </button>
            </form>
            <a
              href="/vote"
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Bukan Saya
            </a>
          </div>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium">
              Nama Lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              minLength={3}
              autoComplete="off"
              placeholder="Tulis nama lengkap Anda"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="placement" className="text-sm font-medium">
              Kelas / Penempatan
            </label>
            <input
              id="placement"
              name="placement"
              required
              autoComplete="off"
              placeholder={allowedClasses.length > 0
                ? `cth: ${allowedClasses[0]} RPL 1, atau "guru"`
                : 'cth: XI RPL 1, atau "guru"'}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRound aria-hidden className="size-4" />
            {isPending ? "Memeriksa..." : "Lanjutkan"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-zinc-400">
        {electionName}
      </p>
    </div>
  );
}
