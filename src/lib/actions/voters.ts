"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { placements, voters, votes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { normalizePlacement } from "@/lib/validation";

export type VoterFormState = {
  error: string | null;
  success: string | null;
};

export type ImportState = {
  error: string | null;
  success: string | null;
  added: number;
  skipped: number;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/voters");
  revalidatePath("/admin/results");
}
// ---------- Tambah satu pemilih ----------

const voterSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
  type: z.enum(["student", "teacher"]),
  // Strict: siswa wajib pilih placement (UUID) yang sudah dibuat;
  // guru otomatis ke placement "GURU".
  placementId: z.string().max(64).optional(),
});

/** Cari (atau buat jika belum ada) placement khusus guru bernama "GURU". */
async function findTeacherPlacement(): Promise<string | null> {
  const [existing] = await db
    .select({ id: placements.id })
    .from(placements)
    .where(eq(placements.name, "GURU"))
    .limit(1);
  return existing?.id ?? null;
}

export async function createVoterAction(
  _prev: VoterFormState,
  formData: FormData,
): Promise<VoterFormState> {
  await requireAdmin();

  const parsed = voterSchema.safeParse({
    fullName: formData.get("fullName"),
    type: formData.get("type"),
    placementId: formData.get("placementId") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  let placementId = parsed.data.placementId ?? "";

  if (parsed.data.type === "teacher") {
    const teacherPlacement = await findTeacherPlacement();
    if (!teacherPlacement) {
      return {
        error:
          'Placement "GURU" belum ada. Buat kelas bernama "GURU" di tab Kelas (Pengaturan) terlebih dahulu.',
        success: null,
      };
    }
    placementId = teacherPlacement;
  } else if (!/^[0-9a-f-]{36}$/i.test(placementId)) {
    return { error: "Pilih kelas dari daftar.", success: null };
  }

  try {
    await db.insert(voters).values({
      fullName: parsed.data.fullName,
      type: parsed.data.type,
      placementId,
    });
  } catch {
    return {
      error: "Pemilih dengan nama & penempatan itu sudah terdaftar.",
      success: null,
    };
  }

  revalidateAdmin();
  return { error: null, success: `Pemilih "${parsed.data.fullName}" ditambahkan.` };
}

// ---------- Import massal (tempel daftar) ----------

// Satu baris = "Nama lengkap | NAMA KELAS" untuk siswa.
// Guru: "Nama lengkap" saja (tanpa pipe) atau "Nama | GURU".
// Kelas strict: harus sudah dibuat di tab Kelas, jika tidak baris dilewati.
const IMPORT_SEPARATOR = "|";

export async function importVotersAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();

  const raw = formData.get("bulk");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { error: "Daftar pemilih kosong.", success: null, added: 0, skipped: 0 };
  }

  // Cache placement yang sudah dicari supaya tidak query berulang.
  const placementCache = new Map<string, string | null>();
  async function resolvePlacement(name: string): Promise<string | null> {
    const normalized = normalizePlacement(name);
    if (placementCache.has(normalized)) {
      return placementCache.get(normalized)!;
    }
    const [row] = await db
      .select({ id: placements.id })
      .from(placements)
      .where(eq(placements.name, normalized))
      .limit(1);
    placementCache.set(normalized, row?.id ?? null);
    return row?.id ?? null;
  }

  const rows: Array<{ fullName: string; type: "student" | "teacher"; placementId: string }> = [];
  const errors: string[] = [];

  for (const [index, line] of raw.split("\n").entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const parts = trimmed.split(IMPORT_SEPARATOR).map((p) => p.trim());
    const fullName = parts[0];
    const placementRaw = parts[1] ?? "";

    if (!fullName || fullName.length < 3) {
      errors.push(`Baris ${index + 1}: nama tidak valid.`);
      continue;
    }

    // Guru: tanpa kelas, atau kelas "GURU".
    const isTeacher =
      placementRaw.length === 0 || normalizePlacement(placementRaw) === "GURU";

    if (isTeacher) {
      const teacherPlacement = await findTeacherPlacement();
      if (!teacherPlacement) {
        errors.push(
          `Baris ${index + 1}: placement "GURU" belum dibuat — buat dulu di tab Kelas.`,
        );
        continue;
      }
      rows.push({ fullName, type: "teacher", placementId: teacherPlacement });
      continue;
    }

    const placementId = await resolvePlacement(placementRaw);
    if (!placementId) {
      errors.push(
        `Baris ${index + 1}: kelas "${placementRaw}" belum terdaftar — buat dulu di tab Kelas.`,
      );
      continue;
    }

    rows.push({ fullName, type: "student", placementId });
  }

  if (rows.length === 0) {
    return {
      error: errors[0] ?? "Tidak ada baris valid untuk diimport.",
      success: null,
      added: 0,
      skipped: 0,
    };
  }

  // Dedup dalam input sendiri.
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.fullName.toLowerCase()}|${r.placementId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Insert baris per baris untuk melaporkan duplikat yang sudah ada di DB.
  let added = 0;
  let skipped = 0;

  for (const row of unique) {
    try {
      await db.insert(voters).values(row);
      added++;
    } catch {
      skipped++;
    }
  }

  revalidateAdmin();

  const message = errors.length > 0
    ? `${added} ditambahkan, ${skipped} dilewati (duplikat). Catatan: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} lainnya)` : ""}`
    : `${added} pemilih ditambahkan, ${skipped} dilewati (sudah terdaftar).`;

  return {
    error: null,
    success: message,
    added,
    skipped,
  };
}

// ---------- Hapus pemilih ----------

export async function deleteVoterAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  await db.delete(voters).where(eq(voters.id, id));
  revalidateAdmin();
}

// ---------- Hapus banyak pemilih ----------

export async function deleteVotersBulkAction(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("ids").filter(
    (v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v),
  );

  if (ids.length === 0) return;

  await db.delete(voters).where(inArray(voters.id, ids));
  revalidateAdmin();
}

// ---------- Reset pilihan seorang pemilih ----------

/**
 * Hapus suara seorang pemilih sehingga ia bisa memilih ulang.
 * Aman terhadap race condition: session voting pemilih tidak ikut
 * diubah, tapi submitVote tetap memverifikasi ulang dari database.
 */
export async function resetVoterVoteAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  await db.delete(votes).where(eq(votes.voterId, id));

  revalidateAdmin();
}
