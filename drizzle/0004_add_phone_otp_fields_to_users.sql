ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_code" varchar(5);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp" varchar(6);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_phone_verified" boolean DEFAULT false;