ALTER TABLE "elections" ADD COLUMN "automatic_results_published" boolean DEFAULT false NOT NULL;
UPDATE "elections"
SET "results_open_at" = "ends_at" + INTERVAL '1 minute'
WHERE "results_publication_mode" = 'automatic'
  AND ("results_open_at" IS NULL OR "results_open_at" <= "ends_at");