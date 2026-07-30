CREATE TABLE "user_query_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_query_replies" ADD CONSTRAINT "user_query_replies_query_id_user_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."user_queries"("id") ON DELETE cascade ON UPDATE no action;