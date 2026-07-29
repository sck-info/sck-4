import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const fieldTypeEnum = pgEnum("field_type", [
  "short_answer",
  "long_answer",
  "date",
  "time",
  "number",
  "star_rating",
  "single_select",
  "multi_select",
  "url",
]);

export const formQuestions = pgTable("form_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fieldLabel: text("field_label").notNull(),
  fieldType: fieldTypeEnum("field_type").notNull(),
  options: jsonb("options"), // Array of options e.g. ["Male", "Female"]
  allowOther: boolean("allow_other").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
