CREATE TABLE "booking_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_id" uuid,
	"sub_category_id" uuid NOT NULL,
	"selected_format" "selected_format",
	"selected_location_id" uuid,
	"form_responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_slot_id_offering_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."offering_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_sub_category_id_offering_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."offering_sub_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_selected_location_id_session_locations_id_fk" FOREIGN KEY ("selected_location_id") REFERENCES "public"."session_locations"("id") ON DELETE set null ON UPDATE no action;