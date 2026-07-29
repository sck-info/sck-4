import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const scheduledMessages = pgTable("scheduled_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  scheduledDate: text("scheduled_date").notNull(), // format YYYY-MM-DD
  isSent: boolean("is_sent").default(false).notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
