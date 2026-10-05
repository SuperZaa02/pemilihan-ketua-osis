CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin');--> statement-breakpoint
CREATE TYPE "public"."candidate_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."election_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."voter_type" AS ENUM('student', 'teacher');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"class_name" text NOT NULL,
	"photo_url" text,
	"bio" text,
	"vision" text NOT NULL,
	"mission" text NOT NULL,
	"status" "candidate_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "election_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"allowed_classes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allow_teachers" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"type" "voter_type" NOT NULL,
	"placement" text NOT NULL,
	"has_voted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "candidates_status_idx" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "elections_status_idx" ON "elections" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "voters_name_placement_idx" ON "voters" USING btree ("full_name","placement");--> statement-breakpoint
CREATE INDEX "voters_type_idx" ON "voters" USING btree ("type");--> statement-breakpoint
CREATE INDEX "voters_placement_idx" ON "voters" USING btree ("placement");