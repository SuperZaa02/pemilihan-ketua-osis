import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { candidates, placements, type Candidate } from "@/db/schema";

export type CandidateWithPlacement = Candidate & {
  placementName: string;
};

const candidateWithPlacementColumns = {
  id: candidates.id,
  fullName: candidates.fullName,
  placementId: candidates.placementId,
  photoUrl: candidates.photoUrl,
  bio: candidates.bio,
  vision: candidates.vision,
  mission: candidates.mission,
  status: candidates.status,
  createdAt: candidates.createdAt,
  updatedAt: candidates.updatedAt,
  placementName: placements.name,
};

/** Semua kandidat (untuk halaman admin). */
export async function getAllCandidates(): Promise<CandidateWithPlacement[]> {
  return db
    .select(candidateWithPlacementColumns)
    .from(candidates)
    .innerJoin(placements, eq(candidates.placementId, placements.id))
    .orderBy(asc(candidates.createdAt));
}

/** Kandidat aktif saja (untuk halaman voting publik). */
export async function getActiveCandidates(): Promise<
  CandidateWithPlacement[]
> {
  return db
    .select(candidateWithPlacementColumns)
    .from(candidates)
    .innerJoin(placements, eq(candidates.placementId, placements.id))
    .where(eq(candidates.status, "active"))
    .orderBy(asc(candidates.createdAt));
}

/** Satu kandidat aktif berdasarkan id (untuk halaman detail publik). */
export async function getActiveCandidateById(
  id: string,
): Promise<CandidateWithPlacement | null> {
  const rows = await db
    .select(candidateWithPlacementColumns)
    .from(candidates)
    .innerJoin(placements, eq(candidates.placementId, placements.id))
    .where(and(eq(candidates.id, id), eq(candidates.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

/** Satu kandidat apa pun statusnya berdasarkan id (untuk form edit admin). */
export async function getCandidateById(
  id: string,
): Promise<CandidateWithPlacement | null> {
  const rows = await db
    .select(candidateWithPlacementColumns)
    .from(candidates)
    .innerJoin(placements, eq(candidates.placementId, placements.id))
    .where(eq(candidates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function countCandidatesByPlacement(
  placementId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COUNT(*)`.mapWith(Number) })
    .from(candidates)
    .where(eq(candidates.placementId, placementId));
  return row?.total ?? 0;
}
