import { count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { candidates, voters, votes } from "@/db/schema";

export type ElectionResults = {
  totalVoters: number;
  totalVotes: number;
  turnoutPercent: number;
  teacherVotes: number;
  studentVotes: number;
  perCandidate: Array<{
    id: string;
    fullName: string;
    className: string;
    photoUrl: string | null;
    status: "active" | "inactive";
    voteCount: number;
    percent: number;
  }>;
};

/**
 * Hasil pemilihan: satu query agregasi per-candidate + statistik global.
 * Percent dihitung dari total suara sah (bukan jumlah pemilih terdaftar).
 */
export async function getElectionResults(): Promise<ElectionResults> {
  const [voterStats] = await db
    .select({
      total: count(),
      voted: sql<number>`COUNT(DISTINCT ${votes.voterId})`.mapWith(Number),
      teacherVotes: sql<number>`COUNT(DISTINCT CASE WHEN ${votes.isTeacherVote} THEN ${votes.voterId} END)`.mapWith(
        Number,
      ),
    })
    .from(voters)
    .leftJoin(votes, eq(votes.voterId, voters.id));

  const totalVoters = voterStats?.total ?? 0;
  const totalVotes = voterStats?.voted ?? 0;
  const teacherVotes = voterStats?.teacherVotes ?? 0;

  const perCandidate = await db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      className: candidates.className,
      photoUrl: candidates.photoUrl,
      status: candidates.status,
      voteCount: sql<number>`COUNT(${votes.id})`.mapWith(Number),
    })
    .from(candidates)
    .leftJoin(votes, eq(votes.candidateId, candidates.id))
    .groupBy(
      candidates.id,
      candidates.fullName,
      candidates.className,
      candidates.photoUrl,
      candidates.status,
    )
    .orderBy(sql`COUNT(${votes.id}) DESC`);

  return {
    totalVoters,
    totalVotes,
    turnoutPercent:
      totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0,
    teacherVotes,
    studentVotes: totalVotes - teacherVotes,
    perCandidate: perCandidate.map((c) => ({
      ...c,
      percent: totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0,
    })),
  };
}
