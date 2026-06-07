import { Hono } from "hono";
import { and, eq, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categories, resources } from "../db/schema";
import type { Env } from "./index";

export const admin = new Hono<{ Bindings: Env }>();

// ─── Resources ────────────────────────────────────────────────────────────────

admin.get("/resources", async (c) => {
  const db = getDb(c.env.DB);
  const q = c.req.query("q")?.trim();
  const status = c.req.query("status");
  const type = c.req.query("type");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const filters = [];
  if (status) filters.push(eq(resources.status, status));
  if (type) filters.push(eq(resources.type, type));
  if (q) {
    const term = `%${q.replace(/[%_]/g, (m) => "\\" + m)}%`;
    filters.push(
      or(
        sql`${resources.title} LIKE ${term}`,
        sql`${resources.description} LIKE ${term}`,
      )!,
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(resources)
    .where(where)
    .all();

  const items = await db
    .select()
    .from(resources)
    .where(where)
    .orderBy(sql`${resources.updatedAt} desc`)
    .limit(limit)
    .offset(offset)
    .all();

  return c.json({ items, total, page, limit, hasMore: offset + items.length < total });
});

admin.post("/resources", async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json<{
    title: string;
    description?: string;
    url?: string;
    categoryId?: number;
    type?: string;
    author?: string;
    tags?: string[];
    status?: string;
  }>();

  if (!body.title?.trim()) return c.json({ error: "title required" }, 400);

  const [row] = await db
    .insert(resources)
    .values({
      title: body.title.trim(),
      description: body.description ?? null,
      url: body.url ?? null,
      categoryId: body.categoryId ?? null,
      type: body.type ?? "article",
      author: body.author ?? null,
      tags: body.tags ?? [],
      source: "manual",
      status: body.status ?? "published",
    })
    .returning();

  return c.json({ item: row }, 201);
});

admin.patch("/resources/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);
  const body = await c.req.json<Partial<{
    title: string;
    description: string | null;
    url: string | null;
    categoryId: number | null;
    type: string;
    author: string | null;
    tags: string[];
    status: string;
  }>>();

  const [row] = await db
    .update(resources)
    .set({
      ...body,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(resources.id, id))
    .returning();

  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ item: row });
});

admin.delete("/resources/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .delete(resources)
    .where(eq(resources.id, id))
    .returning({ id: resources.id });

  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ deleted: row.id });
});

// ─── Categories ───────────────────────────────────────────────────────────────

admin.get("/categories", async (c) => {
  const db = getDb(c.env.DB);
  const all = await db
    .select()
    .from(categories)
    .orderBy(categories.parentId, categories.sortOrder, categories.name)
    .all();
  return c.json({ categories: all });
});

admin.post("/categories", async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json<{
    name: string;
    slug?: string;
    icon?: string;
    description?: string;
    parentId?: number | null;
    sortOrder?: number;
  }>();

  if (!body.name?.trim()) return c.json({ error: "name required" }, 400);

  const slug =
    body.slug?.trim() ||
    body.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const [row] = await db
    .insert(categories)
    .values({
      name: body.name.trim(),
      slug,
      icon: body.icon ?? null,
      description: body.description ?? null,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return c.json({ category: row }, 201);
});

admin.patch("/categories/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);
  const body = await c.req.json<Partial<{
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
    parentId: number | null;
    sortOrder: number;
  }>>();

  const [row] = await db
    .update(categories)
    .set({ ...body, updatedAt: sql`(current_timestamp)` })
    .where(eq(categories.id, id))
    .returning();

  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ category: row });
});

/**
 * DELETE /api/admin/categories/:id
 * Reparents: direct children and resources pointing at this category
 * are moved to this category's own parentId (null = top-level).
 */
admin.delete("/categories/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);

  const [target] = await db
    .select({ parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)
    .all();

  if (!target) return c.json({ error: "not found" }, 404);

  const newParent = target.parentId;

  // Reparent children
  await db
    .update(categories)
    .set({ parentId: newParent, updatedAt: sql`(current_timestamp)` })
    .where(eq(categories.parentId, id));

  // Reparent resources
  await db
    .update(resources)
    .set({ categoryId: newParent, updatedAt: sql`(current_timestamp)` })
    .where(eq(resources.categoryId, id));

  await db.delete(categories).where(eq(categories.id, id));

  return c.json({ deleted: id, reparentedTo: newParent });
});

// ─── Suggestions ──────────────────────────────────────────────────────────────

admin.get("/suggestions", async (c) => {
  const db = getDb(c.env.DB);
  const items = await db
    .select()
    .from(resources)
    .where(eq(resources.status, "pending"))
    .orderBy(sql`${resources.createdAt} asc`)
    .all();
  return c.json({ items });
});

admin.post("/suggestions/:id/approve", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);

  // Optionally accept edits in the body before approving
  const body = await c.req.json<Partial<{
    title: string;
    description: string;
    categoryId: number;
    type: string;
    tags: string[];
  }>>().catch(() => ({}));

  const [row] = await db
    .update(resources)
    .set({
      ...body,
      status: "published",
      updatedAt: sql`(current_timestamp)`,
    })
    .where(and(eq(resources.id, id), eq(resources.status, "pending")))
    .returning();

  if (!row) return c.json({ error: "not found or not pending" }, 404);
  return c.json({ item: row });
});

admin.post("/suggestions/:id/reject", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .update(resources)
    .set({ status: "rejected", updatedAt: sql`(current_timestamp)` })
    .where(and(eq(resources.id, id), eq(resources.status, "pending")))
    .returning({ id: resources.id });

  if (!row) return c.json({ error: "not found or not pending" }, 404);
  return c.json({ rejected: row.id });
});
