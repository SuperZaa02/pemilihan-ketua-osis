import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

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

type VoterListOptions = {
  search?: string;
  placementId?: string;
};

function getVoterConditions(options?: VoterListOptions): SQL[] {
  const conditions: SQL[] = [];

  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(ilike(voters.fullName, term), ilike(placements.name, term))!,
    );
  }

  if (options?.placementId) {
    conditions.push(eq(voters.placementId, options.placementId));
  }

  return conditions;
}

/**
 * Daftar pemilih + status vote. hasVoted dihitung dari EXISTS pada tabel
 * votes (sumber kebenaran) — hindari N+1 dengan query gabungan ini.
 */
export async function getVotersWithVoteStatus(options?: {
  search?: string;
  placementId?: string;
  limit?: number;
  offset?: number;
  sort?: "asc" | "desc";
}): Promise<VoterWithVoteStatus[]> {
  const conditions = getVoterConditions(options);

  let query = db
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
    .orderBy(
      options?.sort === "desc" ? desc(voters.fullName) : asc(voters.fullName),
      asc(voters.id),
    )
    .$dynamic();

  if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset);
  }

  return query;
}

export async function getVoterListCounts(options?: VoterListOptions) {
  const conditions = getVoterConditions(options);
  const [result] = await db
    .select({
      total: count(),
      voted: sql<number>`COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM ${votes} WHERE ${votes.voterId} = ${voters.id}
      ))`.mapWith(Number),
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    total: result?.total ?? 0,
    voted: result?.voted ?? 0,
  };
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
