import { pgEnum } from "drizzle-orm/pg-core";

/** Role admin. */
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin"]);

/** Status kandidat: aktif (tampil & bisa dipilih) / nonaktif. */
export const candidateStatusEnum = pgEnum("candidate_status", [
  "active",
  "inactive",
]);

/** Status pemilihan: draft / open / closed. */
export const electionStatusEnum = pgEnum("election_status", [
  "draft",
  "open",
  "closed",
]);

/** Tipe pemilih: siswa atau guru. */
export const voterTypeEnum = pgEnum("voter_type", ["student", "teacher"]);
