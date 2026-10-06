"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { z } from "zod";

import { db } from "@/db";
import { candidates, elections, voters, votes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseJakartaDateTimeLocal } from "@/lib/datetime";
import { getActiveElection } from "@/lib/queries/election";

export type ElectionFormState = {
  error: string | null;
  success: string | null;
};

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/election");
  revalidatePath("/admin/results");
  revalidatePath("/");
  revalidatePath("/results");
  updateTag("election");
  revalidatePath("/vote");
}

const electionSchema = z
  .object({
    name: z.string().trim().min(3, "Nama pemilihan minimal 3 karakter").max(120),
    startsAt: z.string().transform((value, context) => {
      const date = parseJakartaDateTimeLocal(value);
      if (!date) {
        context.addIssue({ code: "custom", message: "Waktu mulai tidak valid." });
        return z.NEVER;
      }
      return date;
    }),
    endsAt: z.string().transform((value, context) => {
      const date = parseJakartaDateTimeLocal(value);
      if (!date) {
        context.addIssue({ code: "custom", message: "Waktu selesai tidak valid." });
        return z.NEVER;
      }
      return date;
    }),
    resultsPublicationMode: z.enum(["automatic", "manual"]),
    resultsOpenAt: z
      .string()
      .transform((value, context) => {
        const date = parseJakartaDateTimeLocal(value);
        if (!date) {
          context.addIssue({
            code: "custom",
            message: "Waktu publikasi hasil tidak valid.",
          });
          return z.NEVER;
        }
        return date;
      })
      .optional(),
    // Daftar nama placement yang boleh memilih (dari dropdown multi-select).
    allowedPlacements: z
      .array(z.string().max(60))
      .max(200, "Terlalu banyak kelas dipilih"),
  })
  .refine(
    (data) => data.startsAt < data.endsAt,
    {
      message: "Waktu selesai harus setelah waktu mulai.",
      path: ["endsAt"],
    },
  )
  .refine(
    (data) => {
      if (data.resultsPublicationMode === "manual") return true;
      if (!data.resultsOpenAt) return false;

      const resultsOpenAt = data.resultsOpenAt?.getTime() ?? NaN;
      const endsAt = data.endsAt.getTime();
      return (
        Number.isFinite(resultsOpenAt) &&
        Number.isFinite(endsAt) &&
        resultsOpenAt > endsAt
      );
    },
    {
      message: "Waktu publikasi hasil harus setelah waktu penutupan pemilihan.",
      path: ["resultsOpenAt"],
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
    resultsPublicationMode: formData.get("resultsPublicationMode"),
    resultsOpenAt: formData.get("resultsOpenAt") || undefined,
    allowedPlacements: formData.getAll("allowedPlacements").filter(
      (v): v is string => typeof v === "string",
    ),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  const values = {
    name: parsed.data.name,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    resultsPublicationMode: parsed.data.resultsPublicationMode,
    resultsOpenAt:
      parsed.data.resultsPublicationMode === "automatic" &&
      parsed.data.resultsOpenAt
        ? parsed.data.resultsOpenAt
        : null,
    allowedPlacements: parsed.data.allowedPlacements,
    createdBy: session.sub,
  };

  const existing = await getActiveElection();

  if (existing) {
    await db
      .update(elections)
      .set({
        ...values,
        resultsManuallyOpen:
          existing.resultsPublicationMode === parsed.data.resultsPublicationMode
            ? existing.resultsManuallyOpen
            : false,
      })
      .where(eq(elections.id, existing.id));
  } else {
    await db.insert(elections).values(values);
  }

  revalidateAll();
  return { error: null, success: "Pengaturan pemilihan tersimpan." };
}

export async function setElectionStatusAction(formData: FormData) {
  await requireAdmin();

  const status = formData.get("status");
  if (status !== "draft" && status !== "open" && status !== "closed") {
    throw new Error("Status pemilihan tidak valid.");
  }

  const existing = await getActiveElection();
  if (!existing) {
    throw new Error("Belum ada pemilihan yang diatur.");
  }

  await db
    .update(elections)
    .set({
      status,
      ...(status !== "closed"
        ? { resultsManuallyOpen: false, automaticResultsPublished: false }
        : {}),
    })
    .where(eq(elections.id, existing.id));

  revalidateAll();
}

export async function setManualResultsStatusAction(formData: FormData) {
  await requireAdmin();

  const status = formData.get("status");
  if (status !== "open" && status !== "closed") {
    throw new Error("Status publikasi hasil tidak valid.");
  }

  const existing = await getActiveElection();
  if (!existing) {
    throw new Error("Belum ada pemilihan yang diatur.");
  }
  if (existing.resultsPublicationMode !== "manual") {
    throw new Error("Kontrol buka/tutup hanya tersedia pada mode manual.");
  }
  if (status === "open" && existing.startsAt > new Date()) {
    throw new Error("Hasil belum dapat dibuka sebelum pemilihan dimulai.");
  }
  if (status === "open" && existing.status !== "closed") {
    throw new Error("Tutup pemilihan sebelum membuka publikasi hasil.");
  }

  const [updated] = await db
    .update(elections)
    .set({ resultsManuallyOpen: status === "open" })
    .where(
      and(
        eq(elections.id, existing.id),
        eq(elections.resultsPublicationMode, "manual"),
        ...(status === "open" ? [eq(elections.status, "closed")] : []),
      ),
    )
    .returning({ id: elections.id });

  if (!updated) {
    throw new Error("Perubahan gagal karena status pemilihan telah berubah.");
  }

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

/**
 * Hapus SEMUA data pemilihan: semua suara, kandidat, dan pemilih.
 * Placement, pengaturan pemilihan, dan akun admin tidak ikut terhapus.
 */
export async function deleteAllElectionDataAction(): Promise<void> {
  await requireAdmin();

  // Urutan penting: votes -> voters -> candidates (FK, meski cascade).
  await db.transaction(async (tx) => {
    await tx.delete(votes);
    await tx.delete(voters);
    await tx.delete(candidates);
  });

  revalidateAll();
}
