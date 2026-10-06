import { and, eq, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { elections, type Election } from "@/db/schema";

export async function isResultsOpen(
  election?: Election | null,
  now = new Date(),
): Promise<boolean> {
  const activeElection =
    election === undefined ? await getActiveElection() : election;
  if (
    !activeElection ||
    activeElection.status !== "closed" ||
    now < activeElection.startsAt
  ) {
    return false;
  }

  if (activeElection.resultsPublicationMode === "manual") {
    return activeElection.resultsManuallyOpen;
  }

  if (activeElection.automaticResultsPublished) return true;

  const publicationAt =
    activeElection.resultsOpenAt ?? activeElection.endsAt;
  if (now < publicationAt) return false;

  const [published] = await db
    .update(elections)
    .set({ automaticResultsPublished: true })
    .where(
      and(
        eq(elections.id, activeElection.id),
        eq(elections.status, "closed"),
        eq(elections.resultsPublicationMode, "automatic"),
        or(
          lte(elections.resultsOpenAt, now),
          and(
            isNull(elections.resultsOpenAt),
            lte(elections.endsAt, now),
          ),
        ),
      ),
    )
    .returning({ id: elections.id });

  if (published) return true;

  const [latest] = await db
    .select({ automaticResultsPublished: elections.automaticResultsPublished })
    .from(elections)
    .where(eq(elections.id, activeElection.id))
    .limit(1);

  return latest?.automaticResultsPublished ?? false;
}

export async function getActiveElection() {
  const [open] = await db
    .select()
    .from(elections)
    .where(eq(elections.status, "open"))
    .orderBy(sql`starts_at`)
    .limit(1);

  if (open) return open;

  const [latest] = await db
    .select()
    .from(elections)
    .orderBy(sql`created_at`)
    .limit(1);

  return latest ?? null;
}