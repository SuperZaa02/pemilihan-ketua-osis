import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { candidates } from "./candidate";
import { voters } from "./voter";

/**
 * Satu pemilih = satu suara. UNIQUE(voter_id) di level database adalah
 * garansi terakhir anti double-voting: meski terjadi race condition atau
 * bug logika, database menolak vote kedua dari pemilih yang sama.
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => voters.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    isTeacherVote: boolean("is_teacher_vote").notNull().default(false),
    votedAt: timestamp("voted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("votes_voter_id_unique").on(table.voterId),
    index("votes_candidate_id_idx").on(table.candidateId),
  ],
);
