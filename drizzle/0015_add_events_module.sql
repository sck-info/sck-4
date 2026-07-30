CREATE TYPE "public"."event_type" AS ENUM('event', 'update');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" text,
	"type" "event_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"event_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
