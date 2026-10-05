import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  await sql`DROP SCHEMA public CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("Schema public direset.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
