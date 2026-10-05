import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { electionStatusEnum } from "./enums";

// Konfigurasi pemilihan: periode, target pemilih, dan status open/closed.
// Sistem menentukan eligibility pemilih dari data ini saat voting.
// allowedPlacements = nama placement (kelas) yang boleh memilih, diatur
// lewat dropdown di halaman Pengaturan. Kosong = tidak ada yang boleh.
export const elections = pgTable(
  "elections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: electionStatusEnum("status").notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    allowedPlacements: jsonb("allowed_placements")
      .$type<string[]>()
      .notNull()
      .default([]),
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
