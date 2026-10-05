import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { voterTypeEnum } from "./enums";

/**
 * Master data penempatan/kelas: "X.1", "XI.3", "GURU", dll.
 * Semua pemilih & kandidat HARUS merujuk placement yang sudah ada di sini
 * (strict, tanpa teks bebas) agar tidak ada kelas duplikat/typo.
 * Guru tidak dipisah: placement guru (mis. "GURU") tinggal dibuat di
 * tabel yang sama dengan type "teacher".
 */
export const placements = pgTable("placements", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  type: voterTypeEnum("type").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Placement = typeof placements.$inferSelect;
export type NewPlacement = typeof placements.$inferInsert;
