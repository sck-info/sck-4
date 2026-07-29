import { pgTable, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { offeringSlots } from "./offering_slots";
import { offeringSubCategories } from "./offering_sub_categories";
import { sessionLocations } from "./session_locations";
import { selectedFormatEnum } from "./bookings";

export const bookingDrafts = pgTable("booking_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slotId: uuid("slot_id")
    .references(() => offeringSlots.id, { onDelete: "set null" }),
  subCategoryId: uuid("sub_category_id")
    .notNull()
    .references(() => offeringSubCategories.id, { onDelete: "cascade" }),
  selectedFormat: selectedFormatEnum("selected_format"),
  selectedLocationId: uuid("selected_location_id")
    .references(() => sessionLocations.id, { onDelete: "set null" }),
  formResponses: jsonb("form_responses").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
