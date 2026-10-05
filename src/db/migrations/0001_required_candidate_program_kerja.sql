ALTER TABLE "candidates" RENAME COLUMN "bio" TO "legacy_bio";
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "program_kerja" text;
--> statement-breakpoint
UPDATE "candidates"
SET "program_kerja" = 'Program kerja belum diisi. Silakan lengkapi melalui panel admin.';
--> statement-breakpoint
ALTER TABLE "candidates" ALTER COLUMN "program_kerja" SET NOT NULL;