import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Tipe pemilih: siswa atau guru.
// - student  -> placement berisi kelas (contoh: "XI RPL 1")
// - teacher  -> placement selalu "guru"
export const voterTypeEnum = pgEnum("voter_type", ["student", "teacher"]);

// Mencegah double voting: hasVoted di-update saat vote disubmit.
// (Vote per pemilih akan di-enforce UNIQUE(voter_id) di tabel votes
// ketika fitur voting diimplementasikan.)
export const voters = pgTable(
  "voters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    type: voterTypeEnum("type").notNull(),
    placement: text("placement").notNull(),
    hasVoted: text("has_voted"),
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

