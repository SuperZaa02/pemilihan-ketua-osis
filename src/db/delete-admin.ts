import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin } from "node:process";
import { eq } from "drizzle-orm";

import { db, client } from "./index";
import { admins } from "./schema";

/**
 * Script penghapus akun admin.
 *
 * Mode interaktif (default):
 *   pnpm run db:seed:delete-admin
 *
 * Mode piped (automation/testing) — dua baris: username lalu konfirmasi "YA":
 *   printf "username\nYA\n" | pnpm run db:seed:delete-admin
 */

type Prompt = (label: string) => Promise<string>;

function createTtyPrompt(): Prompt {
  const rl = readline.createInterface({ input: stdin });
  return async (label) => (await rl.question(label)).trim();
}

function createPipedPrompt(): Prompt {
  const rl = readline.createInterface({ input: stdin, terminal: false });
  const iterator = rl[Symbol.asyncIterator]();
  let exhausted = false;

  const nextLine = async (): Promise<string | null> => {
    if (exhausted) return null;
    const result = await iterator.next();
    if (result.done) {
      exhausted = true;
      return null;
    }
    return result.value.trim();
  };

  return async (label) => {
    for (;;) {
      const line = await nextLine();
      if (line === null) {
        console.error(`Gagal: jawaban untuk "${label}" kosong (stdin berakhir).`);
        await client.end();
        process.exit(1);
      }
      if ((line as string).length > 0) return line as string;
    }
  };
}

async function main() {
  console.log("\n=== Hapus Akun Admin ===\n");
  const prompt = stdin.isTTY ? createTtyPrompt() : createPipedPrompt();

  const username = (await prompt("Username admin yang dihapus: ")).toLowerCase();

  const [admin] = await db
    .select({ id: admins.id, username: admins.username, name: admins.name })
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);

  if (!admin) {
    console.log(`Admin "${username}" tidak ditemukan.`);
    await client.end();
    process.exit(1);
  }

  const all = await db.select({ id: admins.id }).from(admins);
  const answer = (
    await prompt(
      `Hapus admin "${admin.name}" (${admin.username})? Ketik YA untuk konfirmasi: `,
    )
  ).toUpperCase();

  if (answer !== "YA") {
    console.log("Dibatalkan.");
    await client.end();
    process.exit(0);
  }

  await db.delete(admins).where(eq(admins.id, admin.id));
  console.log(`Admin "${admin.username}" dihapus.`);

  if (all.length <= 1) {
    console.log(
      "Perhatian: itu satu-satunya admin. Jalankan `pnpm run db:seed` "
        + "untuk membuat admin baru sebelum aplikasi dipakai.",
    );
  }

  await client.end();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("Gagal:", error);
  await client.end();
  process.exit(1);
});
