import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { elections, type Election } from "@/db/schema";

/**
 * Pemilihan berjalan: pemilihan dengan status "open", atau kalau tidak
 * ada, pemilihan terbaru (draft/closed) — agar halaman admin tetap bisa
 * mengatur pemilihan berikutnya.
 *
 * CATATAN CACHING: fungsi ini sengaja TIDAK di-cache. Data pemilihan
 * menentukan eligibility voting & panel admin, jadi harus selalu fresh
 * per request. Halaman publik yang di-cache memanggil ini lewat boundary
 * cache masing-masing (lihat src/lib/queries/cached.ts).
 */
export async function getActiveElection(): Promise<Election | null> {
  const open = await db
    .select()
    .from(elections)
    .where(eq(elections.status, "open"))
    .orderBy(desc(elections.startsAt))
    .limit(1);

  if (open[0]) return open[0];

  const latest = await db
    .select()
    .from(elections)
    .orderBy(desc(elections.createdAt))
    .limit(1);

  return latest[0] ?? null;
}
