import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const metrics = pgTable("metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  num: text("num").notNull(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
