import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const paymentQrs = pgTable("payment_qrs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  qrImageUrl: text("qr_image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
