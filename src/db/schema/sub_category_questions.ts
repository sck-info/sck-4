import { pgTable, uuid, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { offeringSubCategories } from "./offering_sub_categories";
import { formQuestions } from "./form_questions";

export const subCategoryQuestions = pgTable("sub_category_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subCategoryId: uuid("sub_category_id")
    .notNull()
    .references(() => offeringSubCategories.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => formQuestions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
