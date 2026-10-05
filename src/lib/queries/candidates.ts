import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { candidates, type Candidate } from "@/db/schema";

/** Semua kandidat (untuk halaman admin). */
export async function getAllCandidates(): Promise<Candidate[]> {
  return db.select().from(candidates).orderBy(asc(candidates.createdAt));
}

/** Kandidat aktif saja (untuk halaman voting publik). */
export async function getActiveCandidates(): Promise<Candidate[]> {
  return db
    .select()
    .from(candidates)
    .where(eq(candidates.status, "active"))
    .orderBy(asc(candidates.createdAt));
}

/** Satu kandidat aktif berdasarkan id (untuk halaman detail publik). */
export async function getActiveCandidateById(
  id: string,
): Promise<Candidate | null> {
  const rows = await db
    .select()
    .from(candidates)
    .where(and(eq(candidates.id, id), eq(candidates.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}
