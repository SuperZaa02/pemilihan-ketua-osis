"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState, useState } from "react";

import {
  saveElectionAction,
  type ElectionFormState,
} from "@/lib/actions/election";
import type { Election } from "@/db/schema";

const initialState: ElectionFormState = { error: null, success: null };

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

export function ElectionForm({ election }: { election: Election | null }) {
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
        <label htmlFor="e-name" className="text-sm font-medium">
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
          <label htmlFor="e-start" className="text-sm font-medium">
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
          <label htmlFor="e-end" className="text-sm font-medium">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="e-classes" className="text-sm font-medium">
          Kelas yang Diperbolehkan Memilih
        </label>
        <textarea
          id="e-classes"
          name="allowedClasses"
          rows={3}
          defaultValue={(election?.allowedClasses ?? ["X", "XI", "XII"]).join(
            ", ",
          )}
          placeholder="X, XI, XII (pisahkan dengan koma atau baris baru)"
          className={inputClass}
        />
        <p className="text-xs text-zinc-500">
          Tingkat kelas yang boleh memilih. Pemilih siswa dengan tingkat di luar
          daftar ini akan ditolak.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allowTeachers"
          defaultChecked={election?.allowTeachers ?? false}
          className="size-4 rounded border-zinc-300"
        />
        Guru diperbolehkan memilih
      </label>

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
