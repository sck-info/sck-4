import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { userQueries } from "./user_queries";

export const userQueryReplies = pgTable("user_query_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  queryId: uuid("query_id")
    .references(() => userQueries.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
