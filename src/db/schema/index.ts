import { admins } from "./auth";
import { candidates } from "./candidate";
import {
  adminRoleEnum,
  candidateStatusEnum,
  electionStatusEnum,
  voterTypeEnum,
} from "./enums";
import { elections } from "./election";
import { placements } from "./placement";
import { voters } from "./voter";
import { votes } from "./vote";

export {
  adminRoleEnum,
  admins,
  candidateStatusEnum,
  candidates,
  electionStatusEnum,
  elections,
  placements,
  voterTypeEnum,
  voters,
  votes,
};

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
export type Placement = typeof placements.$inferSelect;
export type NewPlacement = typeof placements.$inferInsert;
export type Voter = typeof voters.$inferSelect;
export type NewVoter = typeof voters.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
