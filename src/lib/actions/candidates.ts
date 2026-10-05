"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { candidates } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { normalizePlacement } from "@/lib/validation";
import { z } from "zod";

// ---------- Validasi ----------

const candidateSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
  className: z
    .string()
    .trim()
    .min(2, "Kelas minimal 2 karakter")
    .max(40)
    .transform(normalizePlacement),
  bio: z.string().trim().max(500, "Identitas maksimal 500 karakter"),
  vision: z.string().trim().min(5, "Visi minimal 5 karakter").max(1000),
  mission: z.string().trim().min(5, "Misi minimal 5 karakter").max(2000),
  status: z.enum(["active", "inactive"]),
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

export type CandidateFormState = {
  error: string | null;
  success: string | null;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/candidates");
  revalidatePath("/vote");
}

/**
 * Simpan file foto ke public/uploads. Validasi tipe & ukuran di server —
 * nama file digenerate sendiri (jangan pernah percaya nama dari client).
 */
async function savePhoto(
  photo: File | null,
): Promise<{ url?: string; error?: string }> {
  if (!photo || photo.size === 0) return {};

  if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
    return { error: "Foto harus JPG, PNG, atau WebP." };
  }
  if (photo.size > MAX_IMAGE_SIZE) {
    return { error: "Ukuran foto maksimal 2 MB." };
  }

  const ext = photo.type === "image/png"
    ? "png"
    : photo.type === "image/webp"
      ? "webp"
      : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, filename),
    Buffer.from(await photo.arrayBuffer()),
  );

  return { url: `/uploads/${filename}` };
}

async function deletePhotoFile(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // File sudah tidak ada — abaikan.
  }
}

// ---------- Create ----------

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  await requireAdmin();

  const parsed = candidateSchema.safeParse({
    fullName: formData.get("fullName"),
    className: formData.get("className"),
    bio: formData.get("bio") ?? "",
    vision: formData.get("vision"),
    mission: formData.get("mission"),
    status: formData.get("status") ?? "active",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const photo = formData.get("photo");
  const saved = await savePhoto(photo instanceof File ? photo : null);
  if (saved.error) return { error: saved.error, success: null };

  await db.insert(candidates).values({ ...parsed.data, photoUrl: saved.url });  revalidateAdmin();
  redirect("/admin/candidates");
}

// ---------- Update ----------

export async function updateCandidateAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Kandidat tidak ditemukan.", success: null };
  }

  const parsed = candidateSchema.safeParse({
    fullName: formData.get("fullName"),
    className: formData.get("className"),
    bio: formData.get("bio") ?? "",
    vision: formData.get("vision"),
    mission: formData.get("mission"),
    status: formData.get("status") ?? "active",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const [existing] = await db
    .select({ photoUrl: candidates.photoUrl })
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);

  if (!existing) {
    return { error: "Kandidat tidak ditemukan.", success: null };
  }

  const photo = formData.get("photo");
  const saved = await savePhoto(photo instanceof File ? photo : null);
  if (saved.error) return { error: saved.error, success: null };

  // Foto baru diupload -> hapus file lama agar tidak menumpuk.
  if (saved.url) {
    await deletePhotoFile(existing.photoUrl);
  }

  await db
    .update(candidates)
    .set({ ...parsed.data, photoUrl: saved.url ?? existing.photoUrl })
    .where(eq(candidates.id, id));

  revalidateAdmin();
  redirect("/admin/candidates");
}

// ---------- Toggle status ----------

export async function toggleCandidateStatusAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  const [existing] = await db
    .select({ status: candidates.status })
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);

  if (!existing) return;

  await db
    .update(candidates)
    .set({
      status: existing.status === "active" ? "inactive" : "active",
    })
    .where(eq(candidates.id, id));

  revalidateAdmin();
}

// ---------- Delete ----------

export async function deleteCandidateAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;

  const [existing] = await db
    .select({ photoUrl: candidates.photoUrl })
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);

  if (!existing) return;

  await db.delete(candidates).where(eq(candidates.id, id));
  await deletePhotoFile(existing.photoUrl);

  revalidateAdmin();
}
