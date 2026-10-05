import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { voterTypeEnum } from "./enums";

// Tipe pemilih: siswa atau guru.
// - student -> placement berisi kelas (contoh: "XI RPL 1")
// - teacher -> placement selalu "GURU"
export const voters = pgTable(
  "voters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    type: voterTypeEnum("type").notNull(),
    placement: text("placement").notNull(),
    // Audit: ditandai saat pemilih ini menempuh alur identitas di /vote.
    // Kebenaran final satu-pemilih-satu-suara tetap di tabel votes.
    identityConfirmedAt: timestamp("identity_confirmed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Lookup utama saat pemilih mengidentifikasi diri: nama + placement.
    uniqueIndex("voters_name_placement_idx").on(
      table.fullName,
      table.placement,
    ),
    index("voters_type_idx").on(table.type),
    index("voters_placement_idx").on(table.placement),
  ],
);
