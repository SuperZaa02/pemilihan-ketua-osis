import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { db, client } from "./index";
import { admins } from "./schema";
import { hashPassword } from "../lib/auth/password";

/**
 * Script pembuat akun admin.
 * TIDAK MEMBACA CREDENTIAL DARI ENV — semuanya diinput:
 * email (opsional), username, nama lengkap, dan password.
 *
 * Mode interaktif (default):
 *   pnpm run db:seed
 *
 * Mode piped (untuk automation/testing) — satu jawaban per baris:
 *   printf "email\nusername\nNama Lengkap\npassword\npassword\n" | pnpm run db:seed
 *
 * Dipakai saat deployment pertama ketika database masih kosong.
 */

type Prompt = (label: string, opts?: { optional?: boolean }) => Promise<string>;

/** Prompt interaktif untuk TTY: readline.question bekerja normal. */
function createTtyPrompt(): Prompt {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return async (label, opts) => {
    for (;;) {
      const answer = (await rl.question(label)).trim();
      if (answer.length > 0) return answer;
      if (opts?.optional) return "";
      console.log("  Wajib diisi, coba lagi.");
    }
  };
}

/** Prompt untuk stdin piped: baca baris via async iterator (andal di Node 26). */
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

  return async (label, opts) => {
    // Baris kosong diabaikan kecuali opts.optional, supaya urutan jawaban
    // tetap benar walau ada enter kosong tidak sengaja.
    for (;;) {
      const line = await nextLine();
      if (line === null) {
        if (opts?.optional) return "";
        console.error(`Gagal: jawaban untuk "${label}" kosong (stdin berakhir).`);
        rl.close();
        await client.end();
        process.exit(1);
      }
      if ((line as string).length > 0) return line as string;
      if (opts?.optional) return "";
    }
  };
}

async function main() {
  console.log("\n=== Buat Akun Admin ===\n");
  const prompt = stdin.isTTY ? createTtyPrompt() : createPipedPrompt();

  const email = (
    await prompt("Email (opsional, boleh kosong): ", { optional: true })
  ).toLowerCase();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Gagal: format email tidak valid.");
    await client.end();
    process.exit(1);
  }

  const username = (await prompt("Username: ")).toLowerCase();
  if (username.length === 0) {
    console.error("Gagal: username wajib diisi.");
    await client.end();
    process.exit(1);
  }
  if (username.length < 3) {
    console.error("Gagal: username minimal 3 karakter.");
    await client.end();
    process.exit(1);
  }

  const name = await prompt("Nama lengkap: ");
  if (name.length === 0) {
    console.error("Gagal: nama lengkap wajib diisi.");
    await client.end();
    process.exit(1);
  }

  const password = await prompt("Password (min. 8 karakter): ");
  if (password.length < 8) {
    console.error("Gagal: password minimal 8 karakter.");
    await client.end();
    process.exit(1);
  }
  const confirm = await prompt("Ulangi password: ");
  if (confirm !== password) {
    console.error("Gagal: password tidak sama.");
    await client.end();
    process.exit(1);
  }

  const passwordHash = hashPassword(password);

  try {
    await db.insert(admins).values({
      username,
      email: email || null,
      name,
      passwordHash,
    });
    console.log(`\nAdmin "${username}" berhasil dibuat.\n`);
  } catch (error) {
    if (String(error).includes("admins_username_unique")) {
      console.error(`\nGagal: username "${username}" sudah dipakai.\n`);
    } else {
      console.error("\nSeed gagal:", error);
    }
    await client.end();
    process.exit(1);
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
