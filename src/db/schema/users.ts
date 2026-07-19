import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
