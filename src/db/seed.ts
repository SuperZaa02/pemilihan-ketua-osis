import "dotenv/config";
import { sql } from "drizzle-orm";

import { db, client } from "./index";
import { admins } from "./schema";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "Password123";
  const name = process.env.ADMIN_NAME?.trim() ?? "Administrator";

  if (!username || !password) {
    console.error(
      "ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi di .env "
        + "(lihat .env.example).",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD minimal 8 karakter.");
    process.exit(1);
  }

  const existing = await db
    .select({ id: admins.id })
    .from(admins)
    .where(sql`${admins.username} = ${username}`)
    .limit(1);

  const passwordHash = hashPassword(password);

  if (existing.length > 0) {
    // Idempotent: update password & nama kalau admin sudah ada.
    await db
      .update(admins)
      .set({ passwordHash, name })
      .where(sql`${admins.username} = ${username}`);
    console.log(`Admin "${username}" sudah ada — password & nama diperbarui.`);
  } else {
    await db.insert(admins).values({ username, passwordHash, name });
    console.log(`Admin "${username}" berhasil dibuat.`);
  }
}

main()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed gagal:", error);
    await client.end();
    process.exit(1);
  });
