import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { voters, votes, type Voter } from "@/db/schema";
import { normalizePlacement } from "@/lib/validation";

export type VoterWithVoteStatus = Voter & { hasVoted: boolean };

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
      or(ilike(voters.fullName, term), ilike(voters.placement, term)),
    );
  }

  const rows = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placement: voters.placement,
      identityConfirmedAt: voters.identityConfirmedAt,
      createdAt: voters.createdAt,
      updatedAt: voters.updatedAt,
      hasVoted: sql<boolean>`EXISTS (
        SELECT 1 FROM ${votes} WHERE ${votes.voterId} = ${voters.id}
      )`,
    })
    .from(voters)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(voters.placement), asc(voters.fullName));

  return rows;
}

/**
 * Cari pemilih berdasarkan nama + penempatan (alur identitas di /vote).
 * Nama dinormalisasi agar pencocokan toleran terhadap spasi/kapital.
 */
export async function findVoterByIdentity(
  fullName: string,
  placement: string,
): Promise<Voter | null> {
  const rows = await db
    .select()
    .from(voters)
    .where(
      and(
        ilike(voters.fullName, fullName.trim()),
        eq(voters.placement, normalizePlacement(placement)),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
