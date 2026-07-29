import { pgTable, uuid, timestamp, date, time, pgEnum } from "drizzle-orm/pg-core";
import { offeringSubCategories } from "./offering_sub_categories";

export const slotStatusEnum = pgEnum("slot_status", ["available", "booked", "suspended"]);

export const offeringSlots = pgTable("offering_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  subCategoryId: uuid("sub_category_id")
    .notNull()
    .references(() => offeringSubCategories.id, { onDelete: "cascade" }),
  slotDate: date("slot_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: slotStatusEnum("status").default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
