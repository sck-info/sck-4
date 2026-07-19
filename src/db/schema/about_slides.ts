import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const aboutSlides = pgTable("about_slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  tag: text("tag").notNull(),
  alt: text("alt").default("").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
