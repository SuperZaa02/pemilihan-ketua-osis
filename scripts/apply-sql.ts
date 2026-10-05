import "dotenv/config";
import postgres from "postgres";
import { readFileSync } from "node:fs";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const raw = readFileSync(process.argv[2]!, "utf8");
  const stmts = raw
    .split(/--> statement-breakpoint/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const [i, stmt] of stmts.entries()) {
    try {
      await sql.unsafe(stmt);
      console.log("OK  ", i, stmt.slice(0, 60).replace(/\n/g, " "));
    } catch (e) {
      console.log("FAIL", i, (e as Error).message);
    }
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
