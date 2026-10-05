import { count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { placements, voters } from "@/db/schema";

export type PlacementWithUsage = {
  id: string;
  name: string;
  type: "student" | "teacher";
  voterCount: number;
  candidateCount: number;
};

/**
 * Semua placement + jumlah pemilih/kandidat yang memakainya,
 * diurutkan alami (X.1, X.2, ..., XI.1, ..., XII.10) lalu GURU di akhir.
 */
export async function getPlacementsWithUsage(): Promise<
  PlacementWithUsage[]
> {
  const rows = await db
    .select({
      id: placements.id,
      name: placements.name,
      type: placements.type,
      voterCount: sql<number>`(
        SELECT COUNT(*) FROM ${voters} WHERE ${voters.placementId} = ${placements.id}
      )`.mapWith(Number),
      candidateCount: sql<number>`(
        SELECT COUNT(*) FROM candidates c WHERE c.placement_id = ${placements.id}
      )`.mapWith(Number),
    })
    .from(placements)
    .orderBy(naturalPlacementOrder());

  return rows;
}

export async function getAllPlacements() {
  return db
    .select()
    .from(placements)
    .orderBy(naturalPlacementOrder());
}

/**
 * Order alami: X.2 < X.10 < XI.1 — angka dibandingkan numerik.
 * "GURU" selalu paling akhir.
 */
export function naturalPlacementOrder() {
  return sql`(
    CASE WHEN ${placements.name} = 'GURU' THEN 1 ELSE 0 END,
    CASE
      WHEN ${placements.name} ~ '^(X|XI|XII)\\.[0-9]+$' THEN
        LENGTH(regexp_replace(${placements.name}, '[^0-9]', '', 'g')) * 1000
        + (regexp_replace(${placements.name}, '[^0-9]', '', 'g'))::bigint
      ELSE 0
    END,
    ${placements.name}
  ) ASC`;
}

export async function countPlacements(): Promise<number> {
  const [row] = await db.select({ total: count() }).from(placements);
  return row?.total ?? 0;
}

export async function findPlacementByName(name: string) {
  const rows = await db
    .select()
    .from(placements)
    .where(eq(placements.name, name))
    .limit(1);
  return rows[0] ?? null;
}
