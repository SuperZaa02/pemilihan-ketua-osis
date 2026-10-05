"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";

import {
  createVoterAction,
  importVotersAction,
  type ImportState,
  type VoterFormState,
} from "@/lib/actions/voters";

const initialState: VoterFormState = { error: null, success: null };
const initialImportState: ImportState = {
  error: null,
  success: null,
  added: 0,
  skipped: 0,
};

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function VoterForm() {
  const [state, formAction, isPending] = useActionState(
    createVoterAction,
    initialState,
  );

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
        <label htmlFor="v-fullName" className="text-sm font-medium">
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
          <label htmlFor="v-type" className="text-sm font-medium">
            Tipe
          </label>
          <select id="v-type" name="type" defaultValue="student" className={inputClass}>
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="v-placement" className="text-sm font-medium">
            Kelas <span className="text-zinc-400">(kosongkan jika guru)</span>
          </label>
          <input
            id="v-placement"
            name="placement"
            placeholder="cth: XI RPL 1"
            className={inputClass}
          />
        </div>
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

export function VoterImportForm() {
  const [state, formAction, isPending] = useActionState(
    importVotersAction,
    initialImportState,
  );

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
        <label htmlFor="v-bulk" className="text-sm font-medium">
          Daftar Pemilih <span className="text-zinc-400">(satu per baris)</span>
        </label>
        <textarea
          id="v-bulk"
          name="bulk"
          rows={8}
          required
          className={`${inputClass} font-mono text-xs`}
          placeholder={`Budi Santoso | student | XI RPL 1
Siti Aminah | student | X TKJ 2
Andi Wijaya | teacher`}
        />
      </div>

      <p className="text-xs text-zinc-500">
        Format: <code className="rounded bg-zinc-100 px-1">Nama | student | KELAS</code>{" "}
        atau <code className="rounded bg-zinc-100 px-1">Nama | teacher</code>. Duplikat
        otomatis dilewati.
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
