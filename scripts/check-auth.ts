import "dotenv/config";

import { eq, or } from "drizzle-orm";

import { db, client } from "../src/db";
import { admins } from "../src/db/schema";
import { verifyPassword } from "../src/lib/auth/password";

async function main() {
  const identifier = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  const [admin] = await db
    .select({
      id: admins.id,
      username: admins.username,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(
      or(eq(admins.username, identifier), eq(admins.email, identifier)),
    )
    .limit(1);

  if (!admin) {
    console.log("FAIL: admin tidak ditemukan");
    process.exit(1);
  }

  const ok = verifyPassword(password, admin.passwordHash);
  const badOk = verifyPassword("password-salah-banget", admin.passwordHash);

  console.log("password benar diterima:", ok);
  console.log("password salah ditolak:", !badOk);

  if (ok && !badOk) {
    console.log("LOGIN LOGIC: PASS");
  } else {
    console.log("LOGIN LOGIC: FAIL");
    process.exit(1);
  }
}

main()
  .then(() => client.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
