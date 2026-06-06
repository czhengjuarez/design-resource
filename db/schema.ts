import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Categories form a tree: top-level sections -> categories -> subsections.
 * `parentId` is a self-reference (null = top-level section).
 */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"), // emoji
    description: text("description"),
    parentId: integer("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
    updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

/**
 * Resources are the actual links/items. Public suggestions live here too,
 * as rows with status='pending' + submitter_* set; approving flips to 'published'.
 */
export const resources = sqliteTable(
  "resources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("article"), // article|book|talk|video|tool|person|event|thread
    author: text("author"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    imageUrl: text("image_url"),
    source: text("source").notNull().default("manual"), // coda|manual|suggestion
    status: text("status").notNull().default("published"), // published|pending|rejected
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    codaRowId: text("coda_row_id").unique(), // stable id for idempotent re-import
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
    updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => [
    index("resources_category_idx").on(t.categoryId),
    index("resources_status_idx").on(t.status),
    index("resources_type_idx").on(t.type),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
