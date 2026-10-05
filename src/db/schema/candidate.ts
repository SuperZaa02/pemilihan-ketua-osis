import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { candidateStatusEnum } from "./enums";

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
