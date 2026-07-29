import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { offeringCategories } from "./offering_categories";
import { paymentQrs } from "./payment_qrs";

export const offeringSubCategories = pgTable("offering_sub_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => offeringCategories.id, { onDelete: "cascade" }),
  paymentQrId: uuid("payment_qr_id")
    .references(() => paymentQrs.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  topTags: jsonb("top_tags"), // array of strings
  tags: jsonb("tags"), // array of strings
  requiresBooking: boolean("requires_booking").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
