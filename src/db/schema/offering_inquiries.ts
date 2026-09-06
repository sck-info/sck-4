import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const offeringInquiries = pgTable("offering_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phoneCode: text("phone_code").notNull().default("+91"),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
