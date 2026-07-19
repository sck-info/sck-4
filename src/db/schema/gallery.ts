import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const gallery = pgTable("gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").default("").notNull(),
  showInScroll: boolean("show_in_scroll").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
