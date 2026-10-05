import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("TABLES:", rows.map((r) => r.table_name).join(", "));

  const m = await sql`SELECT * FROM drizzle.__drizzle_migrations`;
  console.log("MIGRATIONS:", JSON.stringify(m));

  await sql.end();
}

main();
