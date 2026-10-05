import "dotenv/config";

import { eq } from "drizzle-orm";

import { db, client } from "../src/db";
import {
  candidates,
  placements,
  elections as electionsTable,
  voters,
  votes as votesTable,
} from "../src/db/schema";
import { checkEligibility } from "../src/lib/queries/eligibility";
import { getActiveElection } from "../src/lib/queries/election";

/**
 * E2E business-logic test: menjalankan seluruh alur voting via DB +
 * action logic, termasuk anti double-voting dan eligibility.
 */
async function expect(cond: boolean, label: string) {
  if (cond) {
    console.log("PASS:", label);
  } else {
    console.error("FAIL:", label);
    process.exitCode = 1;
  }
}

async function main() {
  const election = await getActiveElection();
  if (!election) throw new Error("Election tidak ada");

  const allCandidates = await db.select().from(candidates);
  const student = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placementName: placements.name,
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(eq(voters.fullName, "Budi Santoso"))
    .limit(1)
    .then((r) => r[0]!);
  const teacher = await db
    .select({
      id: voters.id,
      fullName: voters.fullName,
      type: voters.type,
      placementName: placements.name,
    })
    .from(voters)
    .innerJoin(placements, eq(voters.placementId, placements.id))
    .where(eq(voters.type, "teacher"))
    .limit(1)
    .then((r) => r[0]!);

  // 1. Eligibility saat draft -> tolak
  const draftCheck = checkEligibility(student, election);
  const draftRejected = !draftCheck.eligible;
  const draftReason = draftRejected ? draftCheck.reason : "";
  await expect(
    draftRejected && draftReason.includes("belum dibuka"),
    `Draft: pemilih ditolak (${draftReason})`,
  );

  // 2. Buka pemilihan
  await db
    .update(electionsTable)
    .set({ status: "open" })
    .where(eq(electionsTable.id, election.id));

  // Cek waktu: startsAt mungkin di masa depan -> set ke now-1h
  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000);
  const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  await db
    .update(electionsTable)
    .set({ startsAt: start, endsAt: end })
    .where(eq(electionsTable.id, election.id));

  const openCheck = checkEligibility(student, await getActiveElection().then((e) => e!));
  await expect(openCheck.eligible, "Open + kelas XI diizinkan: Budi eligible");

  // 3. Guru eligible (allowTeachers = true)
  const teacherCheck = checkEligibility(teacher, await getActiveElection().then((e) => e!));
  await expect(teacherCheck.eligible, "Open + allowTeachers: guru eligible");

  // 4. Vote pertama sukses
  const candidate1 = allCandidates[0]!;
  await db.transaction(async (tx) => {
    await tx.insert(votesTable).values({
      voterId: student.id,
      candidateId: candidate1.id,
      isTeacherVote: false,
    });
  });
  await expect(true, "Vote pertama Budi tercatat");

  // 5. Double vote -> harus GAGAL (unique constraint)
  let doubleVoteRejected = false;
  try {
    await db.insert(votesTable).values({
      voterId: student.id,
      candidateId: allCandidates[1]!.id,
      isTeacherVote: false,
    });
  } catch {
    doubleVoteRejected = true;
  }
  await expect(doubleVoteRejected, "Double vote Budi ditolak DB");

  // 6. Guru vote
  await db.insert(votesTable).values({
    voterId: teacher.id,
    candidateId: candidate1.id,
    isTeacherVote: true,
  });
  await expect(true, "Vote guru tercatat");

  // 7. Hasil: candidate1 = 2 suara
  const { getElectionResults } = await import("../src/lib/queries/results");
  const results = await getElectionResults();
  const top = results.perCandidate.find((c) => c.id === candidate1.id)!;
  await expect(results.totalVotes === 2, `Total suara = 2 (dapat ${results.totalVotes})`);
  await expect(top.voteCount === 2, `Kandidat 1 = 2 suara (dapat ${top.voteCount})`);
  await expect(results.teacherVotes === 1, `Suara guru = 1 (dapat ${results.teacherVotes})`);
  await expect(
    results.turnoutPercent === Math.round((2 / 6) * 100),
    `Partisipasi = ${Math.round((2 / 6) * 100)}% (dapat ${results.turnoutPercent}%)`,
  );

  // Cleanup: hapus votes test
  await db.delete(votesTable);
  await db
    .update(electionsTable)
    .set({ status: "draft" })
    .where(eq(electionsTable.id, election.id));
  console.log("Cleanup: votes test dihapus, status kembali draft.");
}

main()
  .then(() => client.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
