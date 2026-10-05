import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const candidateStatusEnum = pgEnum("candidate_status", [
  "active",
  "inactive",
]);

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    className: text("class_name").notNull(),
    photoUrl: text("photo_url"),
    bio: text("bio"),
    vision: text("vision").notNull(),
    mission: text("mission").notNull(),
    status: candidateStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("candidates_status_idx").on(table.status)],
);

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export const electionStatusEnum = pgEnum("election_status", [
  "draft",
  "open",
  "closed",
]);

// Konfigurasi pemilihan: periode, target pemilih, dan status open/closed.
// Sistem menentukan eligibility pemilih dari data ini saat voting.
export const elections = pgTable(
  "elections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: electionStatusEnum("status").notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    // Kelas yang diperbolehkan memilih, mis. ["X", "XI"].
    allowedClasses: jsonb("allowed_classes")
      .$type<string[]>()
      .notNull()
      .default([]),
    // Apakah guru diperbolehkan memilih.
    allowTeachers: boolean("allow_teachers").notNull().default(false),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("elections_status_idx").on(table.status)],
);

export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
