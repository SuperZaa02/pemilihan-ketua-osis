"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { placements, voters, votes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { normalizePlacement } from "@/lib/validation";

export type PlacementFormState = {
  error: string | null;
  success: string | null;
};

const createPlacementSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama kelas/penempatan wajib diisi")
    .max(60, "Nama kelas maksimal 60 karakter"),
  type: z.enum(["student", "teacher"]),
});

function revalidateAll() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/voters");
  updateTag("placements");
  revalidatePath("/vote");
}

/**
 * Tambah placement baru. Nama dinormalisasi & unik di level database —
 * duplikat ditolak (race condition aman: UniqueViolation ditangkap).
 */
export async function createPlacementAction(
  _prev: PlacementFormState,
  formData: FormData,
): Promise<PlacementFormState> {
  await requireAdmin();

  const parsed = createPlacementSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const name = normalizePlacement(parsed.data.name);

  if (name.length < 2) {
    return { error: "Nama kelas minimal 2 karakter.", success: null };
  }

  try {
    await db.insert(placements).values({ name, type: parsed.data.type });
  } catch {
    return { error: `Kelas "${name}" sudah ada.`, success: null };
  }

  revalidateAll();
  return { error: null, success: `Kelas "${name}" ditambahkan.` };
}

/**
 * Import massal placement, satu baris satu nama.
 * Baris dengan awalan "guru" (mis. "GURU") otomatis type teacher.
 */
export async function importPlacementsAction(
  _prev: PlacementFormState,
  formData: FormData,
): Promise<PlacementFormState> {
  await requireAdmin();

  const raw = formData.get("bulk");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { error: "Daftar kelas kosong.", success: null };
  }

  const names = [
    ...new Set(
      raw
        .split(/\r?\n/)
        .map((line) => normalizePlacement(line))
        .filter((name) => name.length > 0),
    ),
  ];

  if (names.length === 0) {
    return { error: "Tidak ada baris valid untuk diimport.", success: null };
  }

  let added = 0;
  let skipped = 0;

  for (const name of names) {
    const type = name === "GURU" || name.startsWith("GURU")
      ? "teacher"
      : "student";
    try {
      await db.insert(placements).values({ name, type });
      added++;
    } catch {
      skipped++;
    }
  }

  revalidateAll();

  return {
    error: null,
    success:
      `${added} kelas ditambahkan` +
      (skipped > 0 ? `, ${skipped} dilewati (sudah ada).` : "."),
  };
}

/**
 * Hapus placement. Ditolak jika masih dipakai pemilih/kandidat —
 * cek dulu di server agar pesan jelas (FK "restrict" sebagai garansi akhir).
 */
export async function deletePlacementAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  try {
    const placementVoters = await db
      .select({ id: voters.id })
      .from(voters)
      .where(eq(voters.placementId, id));
    const voterIds = placementVoters.map((voter) => voter.id);
    if (voterIds.length > 0) {
      await db.delete(votes).where(inArray(votes.voterId, voterIds));
      await db.delete(voters).where(inArray(voters.id, voterIds));
    }
    await db.delete(placements).where(eq(placements.id, id));
  } catch {
    // Masih dipakai (FK restrict) — abaikan, data tidak rusak.
  }

  revalidateAll();
}
