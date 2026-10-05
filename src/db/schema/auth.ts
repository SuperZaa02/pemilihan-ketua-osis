import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin"]);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Admin bisa login dengan username atau email.
    username: text("username").notNull().unique(),
    email: text("email"),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: adminRoleEnum("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("admins_email_idx").on(table.email)],
);

