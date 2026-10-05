"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { db } from "@/db";
import { candidates } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { z } from "zod";

// ---------- Validasi ----------

const candidateSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
  // Kelas strict: harus UUID placement yang sudah dibuat di Pengaturan.
  placementId: z
    .string()
    .regex(/^[0-9a-f-]{36}$/i, "Pilih kelas dari daftar."),
  bio: z.string().trim().max(500, "Identitas maksimal 500 karakter"),
  vision: z.string().trim().min(5, "Visi minimal 5 karakter").max(1000),
  mission: z.string().trim().min(5, "Misi minimal 5 karakter").max(2000),
  status: z.enum(["active", "inactive"]),
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

export type CandidateFormState = {
  error: string | null;
  success: string | null;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/candidates");
  updateTag("candidates");
  revalidatePath("/vote");
}

let s3Client: S3Client | undefined;

function getS3Config() {
  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } =
    process.env;

  if (!S3_ENDPOINT || !S3_REGION || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error(
      "Konfigurasi S3 belum lengkap. Isi S3_ENDPOINT, S3_REGION, S3_BUCKET, "
        + "S3_ACCESS_KEY_ID, dan S3_SECRET_ACCESS_KEY.",
    );
  }

  const endpoint = new URL(S3_ENDPOINT);
  const publicBaseUrl = (process.env.S3_PUBLIC_URL || `${S3_ENDPOINT}/${S3_BUCKET}`)
    .replace(/\/+$/, "");

  return {
    endpoint: endpoint.toString(),
    region: S3_REGION,
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    publicBaseUrl,
  };
}

function getS3Client(config: ReturnType<typeof getS3Config>) {
  s3Client ??= new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return s3Client;
}

async function savePhoto(
  photo: File | null,
): Promise<{ url?: string; error?: string }> {
  if (!photo || photo.size === 0) return {};

  if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
    return { error: "Foto harus JPG, PNG, WebP, atau GIF." };
  }
  if (photo.size > MAX_IMAGE_SIZE) {
    return { error: "Ukuran foto maksimal 25 MB." };
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const config = getS3Config();
  const key = `candidates/${randomUUID()}.${extensions[photo.type]}`;

  await getS3Client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: Buffer.from(await photo.arrayBuffer()),
    ContentType: photo.type,
  }));

  return { url: `${config.publicBaseUrl}/${key}` };
}

async function deletePhotoFile(url: string | null | undefined) {
  if (!url) return;

  if (url.startsWith("/uploads/")) {
    try {
      await unlink(`${process.cwd()}/public${url}`);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    return;
  }

  const config = getS3Config();
  const objectUrlPrefix = `${config.publicBaseUrl}/`;
  if (!url.startsWith(objectUrlPrefix)) return;

  await getS3Client(config).send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: decodeURIComponent(url.slice(objectUrlPrefix.length)),
  }));
}

// ---------- Create ----------

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  await requireAdmin();

  const parsed = candidateSchema.safeParse({
    fullName: formData.get("fullName"),
    placementId: formData.get("placementId"),
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

  await db.insert(candidates).values({ ...parsed.data, photoUrl: saved.url });

  revalidateAdmin();
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
    placementId: formData.get("placementId"),
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
