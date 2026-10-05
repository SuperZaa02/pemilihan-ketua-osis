"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createVoterAction,
  importVotersAction,
  type ImportState,
  type VoterFormState,
} from "@/lib/actions/voters";
import type { PlacementOption } from "@/components/admin/candidate-form";

const initialState: VoterFormState = { error: null, success: null };
const initialImportState: ImportState = {
  error: null,
  success: null,
  added: 0,
  skipped: 0,
};

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function VoterForm({ placements }: { placements: PlacementOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createVoterAction,
    initialState,
  );
  const [type, setType] = useState<"student" | "teacher">("student");

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
        <label htmlFor="v-fullName" className="text-sm font-medium text-zinc-900">
          Nama Lengkap
        </label>
        <input
          id="v-fullName"
          name="fullName"
          required
          minLength={3}
          placeholder="cth: Budi Santoso"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="v-type" className="text-sm font-medium text-zinc-900">
            Tipe
          </label>
          <select
            id="v-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "student" | "teacher")}
            className={inputClass}
          >
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
          </select>
        </div>

        {type === "student" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="v-placement" className="text-sm font-medium text-zinc-900">
              Kelas
            </label>
            <select
              id="v-placement"
              name="placementId"
              required
              className={inputClass}
            >
              <option value="" disabled>
                {placements.length === 0
                  ? "Belum ada kelas — buat dulu di Pengaturan"
                  : "Pilih kelas..."}
              </option>
              {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  {placement.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Tambah Pemilih"}
      </button>
    </form>
  );
}

export function VoterImportForm({ placements }: { placements: PlacementOption[] }) {
  const [state, formAction, isPending] = useActionState(
    importVotersAction,
    initialImportState,
  );

  const studentPlacements = placements.filter((p) => p.type === "student");

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
        <label htmlFor="v-bulk" className="text-sm font-medium text-zinc-900">
          Daftar Pemilih <span className="text-zinc-500">(satu per baris)</span>
        </label>
        <textarea
          id="v-bulk"
          name="bulk"
          rows={8}
          required
          className={`${inputClass} font-mono text-xs`}
          placeholder={`Budi Santoso | ${studentPlacements[0]?.name ?? "XI.1"}
Siti Aminah | ${studentPlacements[1]?.name ?? "X.2"}
Andi Wijaya | GURU`}
        />
      </div>

      <p className="text-xs text-zinc-600">
        Format: <code className="rounded bg-zinc-100 px-1">Nama | KELAS</code>{" "}
        untuk siswa, atau <code className="rounded bg-zinc-100 px-1">Nama</code> saja
        (atau <code className="rounded bg-zinc-100 px-1">Nama | GURU</code>) untuk guru.
        Kelas harus sudah terdaftar di tab Kelas — baris dengan kelas yang belum
        terdaftar akan dilewati.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-fit rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Mengimport..." : "Import Pemilih"}
      </button>
    </form>
  );
}

export function ResetVoteButton({ voterName }: { voterName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Reset pilihan pemilih ini"
        className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
      >
        Reset Pilihan
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700"
      >
        Ya, reset pilihan {voterName.split(" ")[0]}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        aria-label="Batal"
        className="inline-flex size-6 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}
