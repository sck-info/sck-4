CREATE TYPE "public"."location_type" AS ENUM('online', 'offline');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('short_answer', 'long_answer', 'date', 'time', 'number', 'star_rating', 'single_select', 'multi_select', 'url');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('available', 'booked', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancellation_pending', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."selected_format" AS ENUM('online', 'offline');--> statement-breakpoint
CREATE TABLE "payment_qrs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"qr_image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "location_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_label" text NOT NULL,
	"field_type" "field_type" NOT NULL,
	"options" jsonb,
	"allow_other" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offering_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"sanskrit_text" varchar(250),
	"sanskrit_meaning" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offering_sub_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"payment_qr_id" uuid,
	"name" varchar(150) NOT NULL,
	"description" text,
	"top_tags" jsonb,
	"tags" jsonb,
	"requires_booking" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sub_category_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_category_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offering_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_category_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "slot_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "slot_locations_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"location_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_id" uuid,
	"sub_category_id" uuid NOT NULL,
	"selected_format" "selected_format",
	"selected_location_id" uuid,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"form_responses" jsonb,
	"user_cancellation_reason" text,
	"admin_cancellation_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"raw_feedback" text NOT NULL,
	"enhanced_feedback" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "offering_sub_categories" ADD CONSTRAINT "offering_sub_categories_category_id_offering_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."offering_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_sub_categories" ADD CONSTRAINT "offering_sub_categories_payment_qr_id_payment_qrs_id_fk" FOREIGN KEY ("payment_qr_id") REFERENCES "public"."payment_qrs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category_questions" ADD CONSTRAINT "sub_category_questions_sub_category_id_offering_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."offering_sub_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category_questions" ADD CONSTRAINT "sub_category_questions_question_id_form_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."form_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_slots" ADD CONSTRAINT "offering_slots_sub_category_id_offering_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."offering_sub_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_locations_map" ADD CONSTRAINT "slot_locations_map_slot_id_offering_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."offering_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_locations_map" ADD CONSTRAINT "slot_locations_map_location_id_session_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."session_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_offering_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."offering_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sub_category_id_offering_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."offering_sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_selected_location_id_session_locations_id_fk" FOREIGN KEY ("selected_location_id") REFERENCES "public"."session_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;