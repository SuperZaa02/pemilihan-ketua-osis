"use client";

import { CircleAlert, UserRound } from "lucide-react";
import { useActionState } from "react";

import {
  loadVotersByPlacementAction,
  loginVoterAction,
  type VoterListState,
} from "@/lib/actions/vote";
import type { Placement } from "@/db/schema";

const initialState: VoterListState = { error: null, placementId: null, voters: [] };

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function VoterLoginForm({
  electionName,
  allowedPlacements,
  placements,
}: {
  electionName: string;
  allowedPlacements: string[];
  placements: Placement[];
}) {
  const [state, formAction, isPending] = useActionState(
    loadVotersByPlacementAction,
    initialState,
  );
  const availablePlacements = placements.filter((placement) =>
    allowedPlacements.some(
      (name) => name.trim().toUpperCase() === placement.name.trim().toUpperCase(),
    ),
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

      <form action={formAction} className="flex flex-col gap-4">
        {availablePlacements.length === 0 && (
          <p className="text-sm text-zinc-600">
            Belum ada kelas yang diizinkan untuk memilih. Silakan hubungi panitia.
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="placementId" className="text-sm font-medium text-zinc-900">
            Kelas / Penempatan
          </label>
          <select
            id="placementId"
            name="placementId"
            required
            defaultValue={state.placementId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>Pilih kelas...</option>
            {availablePlacements.map((placement) => (
              <option key={placement.id} value={placement.id}>
                {placement.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Memuat..." : state.placementId ? "Pilih kelas lain" : "Tampilkan nama"}
        </button>
      </form>

      {state.placementId && state.voters.length > 0 && (
        <form action={loginVoterAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="voterId" className="text-sm font-medium text-zinc-900">
              Nama Pemilih
            </label>
            <select
              id="voterId"
              name="voterId"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>Pilih nama Anda...</option>
              {state.voters.map((voter) => (
                <option key={voter.id} value={voter.id} disabled={voter.hasVoted}>
                  {voter.fullName}
                  {voter.hasVoted ? " (sudah memilih)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRound aria-hidden className="size-4" />
            Lanjutkan Memilih
          </button>
        </form>
      )}

      <p className="text-center text-xs text-zinc-600">
        {electionName}
      </p>
    </div>
  );
}
