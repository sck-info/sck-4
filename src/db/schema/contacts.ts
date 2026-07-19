import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  instagramLink: text("instagram_link"),
  linkedinLink: text("linkedin_link"),
  youtubeLink: text("youtube_link"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
