import { pgTable, uuid, varchar, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 20 }),
  phoneCode: varchar("phone_code", { length: 5 }),
  gender: varchar("gender", { length: 10 }),
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: timestamp("otp_expiry"),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  image: text("image"),
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
