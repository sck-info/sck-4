import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const userQueries = pgTable("user_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneCode: text("phone_code").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending").notNull(),
  replyMessage: text("reply_message"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
