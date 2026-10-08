"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export function VoterBulkActions({
  deleteAction,
  resetAction,
  placementId,
}: {
  deleteAction: (formData: FormData) => void;
  resetAction: (formData: FormData) => void;
  placementId: string;
}) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const update = () => setSelectedCount(
      document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').length,
    );
    document.addEventListener("change", update);
    return () => document.removeEventListener("change", update);
  }, []);

  function selectAllVisible() {
    const boxes = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="ids"]'),
    );
    const shouldSelect = boxes.some((box) => !box.checked);
    boxes.forEach((box) => {
      box.checked = shouldSelect;
    });
    setSelectedCount(shouldSelect ? boxes.length : 0);
  }

  function prepareSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    form.querySelectorAll('input[data-selected-voter]').forEach((input) => input.remove());
    document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').forEach((checkbox) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "ids";
      input.value = checkbox.value;
      input.dataset.selectedVoter = "true";
      form.appendChild(input);
    });
  }

  function confirmAction(event: FormEvent<HTMLFormElement>) {
    prepareSubmit(event);
    const operation = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const scope = operation?.value === "placement" ? "kelas/penempatan" : "pemilih terpilih";
    const action = operation?.name === "delete" ? "menghapus" : "mereset suara dari";
    if (!window.confirm(`Yakin ${action} ${scope}?`)) event.preventDefault();
  }

  const disabled = selectedCount === 0 && !placementId;
  const usesPlacementScope = selectedCount === 0 && Boolean(placementId);

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-900">Aksi massal</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {selectedCount > 0 ? `${selectedCount} pemilih dipilih` : placementId ? "Berlaku untuk kelas yang sedang difilter" : "Pilih pemilih dari tabel"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={selectAllVisible} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
          Pilih semua di halaman
        </button>
        <form action={resetAction} onSubmit={confirmAction}>
          <input type="hidden" name="placementId" value={placementId} />
          <button name="reset" value="selected" disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw className="size-3.5" aria-hidden /> {usesPlacementScope ? "Reset suara di kelas" : "Reset suara"}
          </button>
        </form>
        <form action={deleteAction} onSubmit={confirmAction}>
          <input type="hidden" name="placementId" value={placementId} />
          <button name="delete" value="selected" disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
            <Trash2 className="size-3.5" aria-hidden /> {usesPlacementScope ? "Hapus pemilih di kelas" : "Hapus pemilih"}
          </button>
        </form>
      </div>
    </div>
  );
}
