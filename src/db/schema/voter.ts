import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { placements } from "./placement";
import { voterTypeEnum } from "./enums";

// Tipe pemilih: siswa atau guru.
// Placement adalah FK ke tabel placements — strict, tidak ada teks bebas.
export const voters = pgTable(
  "voters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    type: voterTypeEnum("type").notNull(),
    placementId: uuid("placement_id")
      .notNull()
      .references(() => placements.id, { onDelete: "restrict" }),
    // Audit: ditandai setelah suara pemilih berhasil tercatat.
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
    // Hindari data pemilih duplikat dalam placement yang sama.
    uniqueIndex("voters_name_placement_idx").on(
      table.fullName,
      table.placementId,
    ),
    index("voters_type_idx").on(table.type),
    index("voters_placement_idx").on(table.placementId),
  ],
);
