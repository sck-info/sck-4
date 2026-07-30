import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const campaignStatusEnum = pgEnum("campaign_status", ["DRAFT", "PUBLISHED", "CLOSED"]);
export const campaignQuestionTypeEnum = pgEnum("campaign_question_type", [
  "SHORT_ANSWER",
  "LONG_ANSWER",
  "DATE",
  "NUMBER",
  "STAR_RATING",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "URL",
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").default("DRAFT").notNull(),
  thankYouMessage: text("thank_you_message"),
  allowMultipleSubmissions: boolean("allow_multiple_submissions").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  closedAt: timestamp("closed_at"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "no action" }),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "no action" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignSections = pgTable("campaign_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignQuestions = pgTable("campaign_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id").references(() => campaignSections.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  prompt: text("prompt").notNull(),
  note: text("note"),
  questionType: campaignQuestionTypeEnum("question_type").notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  config: jsonb("config").default({}).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignContacts = pgTable("campaign_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 40 }),
  availabilityStatus: varchar("availability_status", { length: 120 }),
  timings: varchar("timings", { length: 160 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignResponses = pgTable("campaign_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  respondentName: varchar("respondent_name", { length: 120 }),
  respondentEmail: varchar("respondent_email", { length: 150 }),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at"),
});

export const campaignAnswers = pgTable("campaign_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => campaignResponses.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => campaignQuestions.id, { onDelete: "cascade" }),
  value: jsonb("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
