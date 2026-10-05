"use client";

import { CircleAlert, CircleCheck, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createPlacementAction,
  deletePlacementAction,
  importPlacementsAction,
  type PlacementFormState,
} from "@/lib/actions/placements";
import {
  saveElectionAction,
  type ElectionFormState,
} from "@/lib/actions/election";
import type { Election } from "@/db/schema";
import type { PlacementWithUsage } from "@/lib/queries/placements";

const initialState: ElectionFormState = { error: null, success: null };
const initialPlacementState: PlacementFormState = {
  error: null,
  success: null,
};

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

function toLocalInputValue(date: Date): string {
  // format untuk <input type="datetime-local">: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function ElectionForm({
  election,
  placements,
}: {
  election: Election | null;
  placements: Array<{ id: string; name: string; type: string }>;
}) {
  const [state, formAction, isPending] = useActionState(
    saveElectionAction,
    initialState,
  );

  // Default: besok 08:00 - 15:00 jika belum ada pengaturan.
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() + 1);
  defaultStart.setHours(8, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(15, 0, 0, 0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <label htmlFor="e-name" className="text-sm font-medium text-zinc-900">
          Nama Pemilihan
        </label>
        <input
          id="e-name"
          name="name"
          required
          minLength={3}
          defaultValue={election?.name ?? "Pemilihan Ketua OSIS 2026"}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="e-start" className="text-sm font-medium text-zinc-900">
            Waktu Mulai
          </label>
          <input
            id="e-start"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(election?.startsAt ?? defaultStart)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="e-end" className="text-sm font-medium text-zinc-900">
            Waktu Selesai
          </label>
          <input
            id="e-end"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(election?.endsAt ?? defaultEnd)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded-lg border border-zinc-200 p-4">
        <legend className="px-1 text-sm font-medium text-zinc-900">
          Kelas / Penempatan yang Diperbolehkan Memilih
        </legend>
        {placements.length === 0 ? (
          <p className="text-sm text-red-600">
            Belum ada kelas terdaftar. Buat kelas dulu di tab Kelas di bawah
            agar bisa mengatur siapa yang boleh memilih.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-zinc-600">
              Centang kelas yang boleh ikut memilih. Untuk melibatkan guru,
              centang penempatan &quot;GURU&quot;.
            </p>
            <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {placements.map((placement) => (
                <label
                  key={placement.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    name="allowedPlacements"
                    value={placement.name}
                    defaultChecked={election?.allowedPlacements.includes(
                      placement.name,
                    )}
                    className="size-4 rounded border-zinc-300"
                  />
                  {placement.name}
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="h-10 w-fit rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}

/**
 * Tombol konfirmasi untuk aksi destruktif (delete, reset).
 * Pakai window.confirm — sederhana dan cukup untuk MVP.
 */
export function ConfirmSubmitButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-900"
        aria-expanded={open}
      >
        {title}
        <span className="text-xs text-zinc-500">{open ? "Tutup" : "Buka"}</span>
      </button>
      {open && <div className="border-t border-zinc-100 px-5 py-4">{children}</div>}
    </div>
  );
}

// ---------- Kelola placement (tab Kelas) ----------

// ---------- Kelola placement (tab Kelas) ----------

export function PlacementManager({
  placements,
}: {
  placements: PlacementWithUsage[];
}) {
  const [createState, createFormAction, isCreating] = useActionState(
    createPlacementAction,
    initialPlacementState,
  );
  const [importState, importFormAction, isImporting] = useActionState(
    importPlacementsAction,
    initialPlacementState,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={createFormAction} className="flex flex-col gap-3">
        {(createState.error || createState.success) && (
          <StateMessage state={createState} />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            name="name"
            required
            placeholder="cth: X.1, XI.3, XII.5"
            className={inputClass}
          />
          <select name="type" defaultValue="student" className={inputClass}>
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
          </select>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
          >
            <Plus aria-hidden className="size-4" />
            {isCreating ? "Menyimpan..." : "Tambah Kelas"}
          </button>
        </div>
      </form>

      <form action={importFormAction} className="flex flex-col gap-3">
        {(importState.error || importState.success) && (
          <StateMessage state={importState} />
        )}
        <textarea
          name="bulk"
          rows={4}
          placeholder={"X.1\nX.2\nXI.3\nGURU"}
          className={`${inputClass} font-mono text-xs`}
        />
        <button
          type="submit"
          disabled={isImporting}
          className="h-9 w-fit rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          {isImporting ? "Mengimport..." : "Import Banyak Kelas"}
        </button>
      </form>

      {placements.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Belum ada kelas. Tambahkan kelas di atas sebelum membuat kandidat
          atau pemilih.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600">
                <th className="px-4 py-2.5 font-medium">Kelas</th>
                <th className="px-4 py-2.5 font-medium">Tipe</th>
                <th className="px-4 py-2.5 font-medium">Pemilih</th>
                <th className="px-4 py-2.5 font-medium">Kandidat</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {placements.map((placement) => {
                const inUse =
                  placement.voterCount > 0 || placement.candidateCount > 0;
                return (
                  <tr
                    key={placement.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-zinc-900">
                      {placement.name}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {placement.type === "student" ? "Siswa" : "Guru"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {placement.voterCount}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {placement.candidateCount}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={deletePlacementAction}>
                        <input
                          type="hidden"
                          name="id"
                          value={placement.id}
                        />
                        <button
                          type="submit"
                          disabled={inUse}
                          title={
                            inUse
                              ? "Kelas masih dipakai pemilih/kandidat"
                              : "Hapus kelas"
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 aria-hidden className="size-3.5" />
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StateMessage({ state }: { state: PlacementFormState }) {
  if (state.error) {
    return (
      <p
        className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        role="alert"
      >
        <CircleAlert aria-hidden className="size-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  return (
    <p
      className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      role="status"
    >
      <CircleCheck aria-hidden className="size-4 shrink-0" />
      {state.success}
    </p>
  );
}
