import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { placements, voters, votes } from "@/db/schema";

export type VoterWithVoteStatus = {
  id: string;
  fullName: string;
  type: "student" | "teacher";
  placementId: string;
  placementName: string;
  identityConfirmedAt: Date | null;
  createdAt: Date;
  hasVoted: boolean;
};

/**
 * Daftar pemilih + status vote. hasVoted dihitung dari EXISTS pada tabel
 * votes (sumber kebenaran) — hindari N+1 dengan query gabungan ini.
 */
export async function getVotersWithVoteStatus(options?: {
  search?: string;
}): Promise<VoterWithVoteStatus[]> {
  const conditions = [];

  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(ilike(voters.fullName, term), ilike(placements.name, term)),
    );
  }

  const rows = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placementId: voters.placementId,
      placementName: placements.name,
      identityConfirmedAt: voters.identityConfirmedAt,
      createdAt: voters.createdAt,
      hasVoted: sql<boolean>`EXISTS (
        SELECT 1 FROM ${votes} WHERE ${votes.voterId} = ${voters.id}
      )`,
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(placements.name), asc(voters.fullName));

  return rows;
}

export async function getVotersForPlacement(placementId: string) {
  return db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      hasVoted: sql<boolean>`EXISTS (
        SELECT 1 FROM ${votes} WHERE ${votes.voterId} = ${voters.id}
      )`,
    })
    .from(voters)
    .where(eq(voters.placementId, placementId))
    .orderBy(asc(voters.fullName));
}
