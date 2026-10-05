import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin } from "node:process";
import { eq } from "drizzle-orm";

import { db, client } from "../src/db";
import { admins } from "../src/db/schema";
import { verifyPassword } from "../src/lib/auth/password";

/**
 * Verifikasi logika login: meminta username & password lewat input
 * (bukan env), lalu menguji verifyPassword terhadap hash di database.
 *
 * Mode piped (testing): printf "username\npassword\n" | pnpm exec tsx scripts/check-auth.ts
 */
async function main() {
  const rl = readline.createInterface({ input: stdin, terminal: false });
  const it = rl[Symbol.asyncIterator]();

  const ask = async () => {
    const r = await it.next();
    return r.done ? "" : r.value.trim();
  };

  const identifier = (await ask()).toLowerCase();
  const password = await ask();
  rl.close();

  const [admin] = await db
    .select({
      id: admins.id,
      username: admins.username,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(eq(admins.username, identifier))
    .limit(1);

  if (!admin) {
    console.log("FAIL: admin tidak ditemukan");
    await client.end();
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
    await client.end();
    process.exit(1);
  }

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
