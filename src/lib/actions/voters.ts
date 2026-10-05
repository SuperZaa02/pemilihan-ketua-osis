"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { voters } from "@/db/schema";
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
}

// ---------- Tambah satu pemilih ----------

const voterSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
  type: z.enum(["student", "teacher"]),
  // Untuk siswa: kelas, mis. "XI RPL 1". Untuk guru: "GURU" (otomatis).
  placement: z.string().trim().max(60),
});

export async function createVoterAction(
  _prev: VoterFormState,
  formData: FormData,
): Promise<VoterFormState> {
  await requireAdmin();

  const parsed = voterSchema.safeParse({
    fullName: formData.get("fullName"),
    type: formData.get("type"),
    placement: formData.get("placement"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const placement =
    parsed.data.type === "teacher"
      ? "GURU"
      : normalizePlacement(parsed.data.placement);

  if (parsed.data.type === "student" && placement.length < 2) {
    return { error: "Kelas wajib diisi untuk pemilih siswa.", success: null };
  }

  try {
    await db.insert(voters).values({
      fullName: parsed.data.fullName,
      type: parsed.data.type,
      placement,
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

// Format per baris: "Nama <spasi/koma?> placement" — kita pakai format
// sederhana: NAMA<TAB ATAU PIPE>TYPE<ATAU>PLACEMENT tidak praktis.
// Format yang dipakai: satu baris = "Nama lengkap | student | XI RPL 1"
// atau "Nama lengkap | teacher" (placement guru otomatis "GURU").
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

  const rows: Array<{
    fullName: string;
    type: "student" | "teacher";
    placement: string;
  }> = [];

  const errors: string[] = [];

  for (const [index, line] of raw.split("\n").entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const parts = trimmed.split(IMPORT_SEPARATOR).map((p) => p.trim());
    const fullName = parts[0];
    const typeRaw = (parts[1] ?? "student").toLowerCase();
    const placementRaw = parts[2] ?? "";

    if (!fullName || fullName.length < 3) {
      errors.push(`Baris ${index + 1}: nama tidak valid.`);
      continue;
    }
    if (typeRaw !== "student" && typeRaw !== "teacher") {
      errors.push(`Baris ${index + 1}: tipe harus "student" atau "teacher".`);
      continue;
    }

    const placement =
      typeRaw === "teacher" ? "GURU" : normalizePlacement(placementRaw);

    if (typeRaw === "student" && placement.length < 2) {
      errors.push(`Baris ${index + 1}: kelas wajib diisi untuk siswa.`);
      continue;
    }

    rows.push({ fullName, type: typeRaw, placement });
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
    const key = `${r.fullName.toLowerCase()}|${r.placement}`;
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
