import { pgTable, uuid, timestamp, integer, text, boolean } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  rawFeedback: text("raw_feedback").notNull(),
  enhancedFeedback: text("enhanced_feedback"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
