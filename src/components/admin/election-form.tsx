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

const initialState: ElectionFormState = {
  error: null,
  success: null,
};

const initialPlacementState: PlacementFormState = {
  error: null,
  success: null,
};

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

function toLocalInputValue(date: Date): string {
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

  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() + 1);
  defaultStart.setHours(8, 0, 0, 0);

  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(15, 0, 0, 0);

  return (
    <form action={formAction} className="space-y-6">
      {(state.error || state.success) && (
        <StateMessage
          state={{
            error: state.error,
            success: state.success,
          }}
        />
      )}

      {/* Informasi pemilihan */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Informasi Pemilihan
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Atur nama dan waktu pelaksanaan pemilihan.
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
          <div className="space-y-1.5">
            <label
              htmlFor="e-name"
              className="text-sm font-medium text-zinc-800"
            >
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
            <div className="space-y-1.5">
              <label
                htmlFor="e-start"
                className="text-sm font-medium text-zinc-800"
              >
                Waktu Mulai
              </label>

              <input
                id="e-start"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={toLocalInputValue(
                  election?.startsAt ?? defaultStart,
                )}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="e-end"
                className="text-sm font-medium text-zinc-800"
              >
                Waktu Selesai
              </label>

              <input
                id="e-end"
                name="endsAt"
                type="datetime-local"
                required
                defaultValue={toLocalInputValue(
                  election?.endsAt ?? defaultEnd,
                )}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sesi yang diperbolehkan */}
      <section
        id="allowed-placements-fieldset"
        className="space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Sesi Pemilih
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Tentukan kelas atau sesi yang diperbolehkan mengikuti pemilihan.
              Untuk guru dan staff, pilih sesi yang sesuai.
            </p>
          </div>

          {placements.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const fieldset = document.getElementById(
                  "allowed-placements-fieldset",
                );

                if (!fieldset) return;

                fieldset
                  .querySelectorAll<HTMLInputElement>(
                    'input[name="allowedPlacements"]',
                  )
                  .forEach((input) => {
                    input.checked = true;
                  });
              }}
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Pilih Semua
            </button>
          )}
        </div>

        {placements.length === 0 ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              Belum ada kelas terdaftar. Buat kelas terlebih dahulu di tab
              Kelas agar dapat mengatur siapa yang boleh memilih.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {placements.map((placement) => (
                <label
                  key={placement.id}
                  className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    name="allowedPlacements"
                    value={placement.name}
                    defaultChecked={election?.allowedPlacements.includes(
                      placement.name,
                    )}
                    className="size-4 rounded border-zinc-300 accent-zinc-900"
                  />

                  <span className="truncate">{placement.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Form action */}
      <div className="flex justify-end border-t border-zinc-100 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 w-full rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}

/**
 * Tombol konfirmasi untuk aksi destruktif.
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

        <span className="text-xs text-zinc-500">
          {open ? "Tutup" : "Buka"}
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------- Kelola placement ----------

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
    <div className="space-y-6">
      {/* Tambah kelas */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Tambah Kelas
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Tambahkan satu sesi secara manual.
          </p>
        </div>

        <form
          action={createFormAction}
          className="rounded-lg border border-zinc-200 p-4"
        >
          {createState.error || createState.success ? (
            <div className="mb-4">
              <StateMessage state={createState} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px_auto]">
            <input
              name="name"
              required
              placeholder="Contoh: X.1, XI.3, XII.5"
              className={inputClass}
            />

            <select
              name="type"
              defaultValue="student"
              className={inputClass}
            >
              <option value="student">Siswa</option>
              <option value="teacher">Guru</option>
            </select>

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus aria-hidden className="size-4" />
              {isCreating ? "Menyimpan..." : "Tambah"}
            </button>
          </div>
        </form>
      </section>

      {/* Import kelas */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Import Banyak Kelas
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Masukkan satu kelas per baris.
          </p>
        </div>

        <form
          action={importFormAction}
          className="rounded-lg border border-zinc-200 p-4"
        >
          {importState.error || importState.success ? (
            <div className="mb-4">
              <StateMessage state={importState} />
            </div>
          ) : null}

          <div className="space-y-3">
            <textarea
              name="bulk"
              rows={5}
              placeholder={"X.1\nX.2\nXI.3\nGURU"}
              className={`${inputClass} h-auto resize-y py-2 font-mono text-xs leading-5`}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isImporting}
                className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? "Mengimport..." : "Import Kelas"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Daftar kelas */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Daftar Kelas
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Kelola sesi yang tersedia dalam sistem.
          </p>
        </div>

        {placements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">
              Belum ada kelas. Tambahkan kelas di atas sebelum membuat kandidat
              atau pemilih.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                    <th className="px-4 py-3 font-medium">Kelas</th>
                    <th className="px-4 py-3 font-medium">Tipe</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Pemilih
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Kandidat
                    </th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {placements.map((placement) => {
                    const inUse =
                      placement.voterCount > 0 ||
                      placement.candidateCount > 0;

                    return (
                      <tr
                        key={placement.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {placement.name}
                        </td>

                        <td className="px-4 py-3 text-zinc-500">
                          {placement.type === "student"
                            ? "Siswa"
                            : "Guru"}
                        </td>

                        <td className="px-4 py-3 text-center tabular-nums text-zinc-600">
                          {placement.voterCount}
                        </td>

                        <td className="px-4 py-3 text-center tabular-nums text-zinc-600">
                          {placement.candidateCount}
                        </td>

                        <td className="px-4 py-3 text-right">
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
                              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2
                                aria-hidden
                                className="size-3.5"
                              />
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
          </div>
        )}
      </section>
    </div>
  );
}

function StateMessage({
  state,
}: {
  state: {
    error: string | null;
    success: string | null;
  };
}) {
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

  if (state.success) {
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

  return null;
}
