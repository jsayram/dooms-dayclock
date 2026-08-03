import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Cloud-saved plans are deliberately small. Timer state, accountability
 * pledges, provider credentials, and guest drafts do not belong in this table.
 */
export const savedPlans = sqliteTable(
  "saved_plans",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    finishAtMs: integer("finish_at_ms").notNull(),
    tasksJson: text("tasks_json").notNull(),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("saved_plans_owner_id_id_idx").on(table.ownerId, table.id),
  ],
);
