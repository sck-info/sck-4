import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const marquees = pgTable("marquees", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  link: text("link"),
  linkText: text("link_text"),
  isActive: boolean("is_active").default(false).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Marquee = typeof marquees.$inferSelect;
export type NewMarquee = typeof marquees.$inferInsert;
