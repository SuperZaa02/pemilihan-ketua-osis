"use client";

import { CircleAlert, X } from "lucide-react";
import { useActionState } from "react";

import {
  createCandidateAction,
  updateCandidateAction,
  type CandidateFormState,
} from "@/lib/actions/candidates";
import type { Candidate } from "@/db/schema";

const initialState: CandidateFormState = { error: null, success: null };

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function CandidateForm({ candidate }: { candidate?: Candidate }) {
  const isEdit = Boolean(candidate);
  const action = isEdit ? updateCandidateAction : createCandidateAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

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

      {candidate && <input type="hidden" name="id" value={candidate.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium">
            Nama Lengkap
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            minLength={3}
            defaultValue={candidate?.fullName}
            placeholder="cth: Budi Santoso"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="className" className="text-sm font-medium">
            Kelas
          </label>
          <input
            id="className"
            name="className"
            required
            defaultValue={candidate?.className}
            placeholder="cth: XI RPL 1"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Identitas / Bio <span className="text-zinc-400">(opsional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          defaultValue={candidate?.bio ?? ""}
          placeholder="cth: Putra kedua dari pasangan Bpk. ... & Ibu ..., anak aktif ..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vision" className="text-sm font-medium">
          Visi
        </label>
        <textarea
          id="vision"
          name="vision"
          required
          rows={2}
          defaultValue={candidate?.vision}
          placeholder="Visi kandidat"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="mission" className="text-sm font-medium">
          Misi
        </label>
        <textarea
          id="mission"
          name="mission"
          required
          rows={3}
          defaultValue={candidate?.mission}
          placeholder="Misi kandidat"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="photo" className="text-sm font-medium">
            Foto {isEdit && <span className="text-zinc-400">(opsional)</span>}
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={candidate?.status ?? "active"}
            className={inputClass}
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Kandidat"}
        </button>
      </div>
    </form>
  );
}

export function CloseButton() {
  return (
    <button
      type="submit"
      name="close"
      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      title="Tutup"
    >
      <X aria-hidden className="size-4" />
      <span className="sr-only">Tutup</span>
    </button>
  );
}
