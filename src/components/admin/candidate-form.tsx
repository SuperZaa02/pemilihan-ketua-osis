"use client";

import { CircleAlert } from "lucide-react";
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

export type PlacementOption = {
  id: string;
  name: string;
  type: "student" | "teacher";
};

export function CandidateForm({
  candidate,
  placements,
}: {
  candidate?: Candidate;
  placements: PlacementOption[];
}) {
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
          <label htmlFor="fullName" className="text-sm font-medium text-zinc-900">
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
          <label htmlFor="placementId" className="text-sm font-medium text-zinc-900">
            Kelas
          </label>
          <select
            id="placementId"
            name="placementId"
            required
            defaultValue={candidate?.placementId ?? ""}
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
          {placements.length === 0 && (
            <p className="text-xs text-red-600">
              Belum ada kelas terdaftar. Buat kelas dulu di halaman
              Pengaturan → tab Kelas.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-zinc-900">
          Identitas / Bio <span className="text-zinc-500">(opsional)</span>
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
        <label htmlFor="vision" className="text-sm font-medium text-zinc-900">
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
        <label htmlFor="mission" className="text-sm font-medium text-zinc-900">
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
          <label htmlFor="photo" className="text-sm font-medium text-zinc-900">
            Foto {isEdit && <span className="text-zinc-500">(opsional)</span>}
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium"
          />
          <p className="text-xs text-zinc-500">
            JPG, PNG, WebP, atau GIF. Maksimal 25 MB.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-zinc-900">
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
