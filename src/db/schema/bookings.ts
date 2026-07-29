import { pgTable, uuid, timestamp, text, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { offeringSlots } from "./offering_slots";
import { offeringSubCategories } from "./offering_sub_categories";
import { sessionLocations } from "./session_locations";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancellation_pending",
  "cancelled",
  "completed",
]);

export const selectedFormatEnum = pgEnum("selected_format", ["online", "offline"]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  slotId: uuid("slot_id")
    .references(() => offeringSlots.id, { onDelete: "set null" }),
  subCategoryId: uuid("sub_category_id")
    .notNull()
    .references(() => offeringSubCategories.id),
  selectedFormat: selectedFormatEnum("selected_format"),
  selectedLocationId: uuid("selected_location_id")
    .references(() => sessionLocations.id),
  status: bookingStatusEnum("status").default("pending").notNull(),
  formResponses: jsonb("form_responses"),
  userCancellationReason: text("user_cancellation_reason"),
  adminCancellationReason: text("admin_cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});
