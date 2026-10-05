import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { candidateStatusEnum } from "./enums";
import { placements } from "./placement";

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    // Kelas asal kandidat — strict, harus placement yang terdaftar.
    placementId: uuid("placement_id")
      .notNull()
      .references(() => placements.id, { onDelete: "restrict" }),
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
  (table) => [
    index("candidates_status_idx").on(table.status),
    index("candidates_placement_idx").on(table.placementId),
  ],
);
