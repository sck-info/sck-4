import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const eventTypeEnum = pgEnum("event_type", ["event", "update"]);

export enum EventType {
  EVENT = "event",
  UPDATE = "update",
}

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  link: text("link"),
  type: eventTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
