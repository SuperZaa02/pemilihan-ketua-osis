"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { db } from "@/db";
import { elections, votes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getActiveElection } from "@/lib/queries/election";

export type ElectionFormState = {
  error: string | null;
  success: string | null;
};

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/election");
  revalidatePath("/admin/results");
  revalidatePath("/vote");
}

const electionSchema = z
  .object({
    name: z.string().trim().min(3, "Nama pemilihan minimal 3 karakter").max(120),
    startsAt: z.string().min(1, "Waktu mulai wajib diisi"),
    endsAt: z.string().min(1, "Waktu selesai wajib diisi"),
    // Teks daftar kelas, satu per baris atau dipisah koma: "X, XI, XII".
    allowedClassesRaw: z.string().max(500),
    allowTeachers: z.boolean(),
  })
  .refine(
    (data) => new Date(data.startsAt) < new Date(data.endsAt),
    {
      message: "Waktu selesai harus setelah waktu mulai.",
      path: ["endsAt"],
    },
  );

export async function saveElectionAction(
  _prev: ElectionFormState,
  formData: FormData,
): Promise<ElectionFormState> {
  const session = await requireAdmin();

  const parsed = electionSchema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    allowedClassesRaw: formData.get("allowedClasses") ?? "",
    allowTeachers: formData.get("allowTeachers") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const allowedClasses = parsed.data.allowedClassesRaw
    .split(/[\n,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const values = {
    name: parsed.data.name,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
    allowedClasses,
    allowTeachers: parsed.data.allowTeachers,
    createdBy: session.sub,
  };

  const existing = await getActiveElection();

  if (existing) {
    await db.update(elections).set(values).where(eq(elections.id, existing.id));
  } else {
    await db.insert(elections).values(values);
  }

  revalidateAll();
  return { error: null, success: "Pengaturan pemilihan tersimpan." };
}

export async function setElectionStatusAction(formData: FormData) {
  await requireAdmin();

  const status = formData.get("status");
  if (status !== "draft" && status !== "open" && status !== "closed") return;

  const existing = await getActiveElection();
  if (!existing) return;

  await db
    .update(elections)
    .set({ status })
    .where(eq(elections.id, existing.id));

  revalidateAll();
}

/**
 * Reset hasil: hapus semua suara. irreversibel — dipakai sebelum
 * pemilihan dimulai / untuk latihan.
 */
export async function resetResultsAction(): Promise<void> {
  await requireAdmin();

  await db.delete(votes);
  revalidateAll();
}
