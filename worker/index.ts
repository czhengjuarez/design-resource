import { Hono } from "hono";
import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categories, resources, type Category } from "../db/schema";
import { admin } from "./admin";
import { adminAuth, authRoutes } from "./auth";

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  // Added in later phases:
  // AI: Ai;
  // VECTORIZE: VectorizeIndex;
  // IMAGES: R2Bucket;
}

/**
 * Extract a sortable last name from a display name.
 * Strips emoji, parenthetical content (pronouns, labels), and trailing
 * credentials (", CPCC, ACC"), then returns the last space-delimited token.
 *
 * Examples:
 *   "Brad Frost"                        → "frost"
 *   "Changying (Z) Zheng"               → "zheng"
 *   "Derek Featherstone (He/Him)"       → "featherstone"
 *   "Sheri Byrne-Haber (disabled) …"   → "byrne-haber"
 *   "Teresa Brazen, CPCC, ACC"          → "brazen"
 *   "🐱 Catt Small 👩🏾‍💻"               → "small"
 */
function lastName(title: string): string {
  const cleaned = title
    .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "") // strip emoji
    .replace(/\([^)]*\)/g, "")   // strip (...) blocks
    .replace(/,.*$/, "")         // strip ", credentials" suffix
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return (parts.at(-1) ?? cleaned).toLowerCase();
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() }),
);

/** A category node plus its published-resource count and nested children. */
type CategoryNode = Category & { resourceCount: number; children: CategoryNode[] };

/**
 * GET /api/categories
 * Returns the full category tree (top-level sections -> ... -> leaves), each
 * node carrying a direct published-resource count. The frontend rolls counts up.
 */
app.get("/api/categories", async (c) => {
  const db = getDb(c.env.DB);

  const all = await db.select().from(categories).all();

  const counts = await db
    .select({
      categoryId: resources.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(resources)
    .where(eq(resources.status, "published"))
    .groupBy(resources.categoryId)
    .all();

  const countByCat = new Map<number, number>();
  for (const row of counts) {
    if (row.categoryId != null) countByCat.set(row.categoryId, row.count);
  }

  const nodes = new Map<number, CategoryNode>();
  for (const cat of all) {
    nodes.set(cat.id, {
      ...cat,
      resourceCount: countByCat.get(cat.id) ?? 0,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId != null && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const bySort = (a: CategoryNode, b: CategoryNode) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const sortTree = (list: CategoryNode[]) => {
    list.sort(bySort);
    for (const n of list) sortTree(n.children);
  };
  sortTree(roots);

  return c.json({ categories: roots });
});

const ALLOWED_TYPES = new Set([
  "article",
  "book",
  "talk",
  "video",
  "tool",
  "person",
  "event",
  "thread",
  "note",
  "method",
  "podcast",
  "newsletter",
]);

/**
 * GET /api/resources
 * Query params:
 *   category — category id; expands to include all descendant categories
 *   type     — resource type filter
 *   q        — search across title/description/author
 *   page     — 1-based page number (default 1)
 *   limit    — page size (default 24, max 100)
 */
app.get("/api/resources", async (c) => {
  const db = getDb(c.env.DB);

  const categoryParam = c.req.query("category");
  const type = c.req.query("type");
  const q = c.req.query("q")?.trim();
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") ?? "24", 10) || 24),
  );
  const offset = (page - 1) * limit;

  const filters = [eq(resources.status, "published")];

  if (categoryParam) {
    const rootId = parseInt(categoryParam, 10);
    if (!Number.isNaN(rootId)) {
      const all = await db
        .select({ id: categories.id, parentId: categories.parentId })
        .from(categories)
        .all();
      const childrenOf = new Map<number, number[]>();
      for (const cat of all) {
        if (cat.parentId != null) {
          const arr = childrenOf.get(cat.parentId) ?? [];
          arr.push(cat.id);
          childrenOf.set(cat.parentId, arr);
        }
      }
      const ids: number[] = [];
      const stack = [rootId];
      while (stack.length) {
        const id = stack.pop()!;
        ids.push(id);
        for (const child of childrenOf.get(id) ?? []) stack.push(child);
      }
      filters.push(inArray(resources.categoryId, ids));
    }
  }

  if (type && ALLOWED_TYPES.has(type)) {
    filters.push(eq(resources.type, type));
  }

  if (q) {
    const term = `%${q.replace(/[%_]/g, (m) => "\\" + m)}%`;
    filters.push(
      or(
        like(resources.title, term),
        like(resources.description, term),
        like(resources.author, term),
      )!,
    );
  }

  const where = and(...filters);

  // When all results are persons (explicit filter or a people-only category),
  // fetch everything and sort by last name A-Z. The set is always small enough
  // to hold in memory, and newly added people slot in automatically.
  const [{ total: totalCount }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(resources)
    .where(where)
    .all();
  const [{ total: personCount }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(resources)
    .where(and(where, eq(resources.type, "person")))
    .all();
  const allPersons = totalCount > 0 && totalCount === personCount;

  if (allPersons) {
    const all = await db.select().from(resources).where(where).all();
    all.sort((a, b) => lastName(a.title).localeCompare(lastName(b.title)));
    const total = all.length;
    const items = all.slice(offset, offset + limit);
    return c.json({ items, total, page, limit, hasMore: offset + items.length < total });
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(resources)
    .where(where)
    .all();

  const items = await db
    .select()
    .from(resources)
    .where(where)
    .orderBy(sql`${resources.createdAt} desc`, resources.id)
    .limit(limit)
    .offset(offset)
    .all();

  return c.json({
    items,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  });
});

/** GET /api/resources/:id — single published resource. */
app.get("/api/resources/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) return c.json({ error: "invalid id" }, 400);

  const db = getDb(c.env.DB);
  const [item] = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.status, "published")))
    .limit(1)
    .all();

  if (!item) return c.json({ error: "not found" }, 404);
  return c.json({ item });
});

/**
 * POST /api/suggestions — public resource submission.
 * Inserts as status='pending', source='suggestion' for admin review
 * (see /api/admin/suggestions). Spam mitigations need no external services:
 *   - honeypot: a field hidden from real users; bots tend to fill every field
 *   - renderedAt: client-supplied timestamp from when the form mounted; a
 *     submission faster than a human could plausibly fill the form is rejected
 * Both failures return a generic success response so bots don't learn to adapt.
 */
const MIN_FILL_TIME_MS = 3_000;

app.post("/api/suggestions", async (c) => {
  const body = await c.req.json<{
    title?: string;
    url?: string;
    type?: string;
    categoryId?: number | null;
    description?: string;
    submitterName?: string;
    submitterEmail?: string;
    honeypot?: string;
    renderedAt?: number;
  }>().catch(() => ({}) as Record<string, never>);

  const looksLikeSpam =
    !!body.honeypot?.trim() ||
    typeof body.renderedAt !== "number" ||
    Date.now() - body.renderedAt < MIN_FILL_TIME_MS;

  const title = body.title?.trim();
  if (!title) return c.json({ error: "title required" }, 400);

  const type = body.type && ALLOWED_TYPES.has(body.type) ? body.type : "article";

  if (looksLikeSpam) {
    // Pretend success — don't reveal the spam check to automated submitters.
    return c.json({ ok: true }, 201);
  }

  const db = getDb(c.env.DB);

  let categoryId: number | null = null;
  if (body.categoryId != null) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1)
      .all();
    categoryId = cat?.id ?? null;
  }

  await db.insert(resources).values({
    title,
    description: body.description?.trim() || null,
    url: body.url?.trim() || null,
    categoryId,
    type,
    source: "suggestion",
    status: "pending",
    submitterName: body.submitterName?.trim() || null,
    submitterEmail: body.submitterEmail?.trim() || null,
  });

  return c.json({ ok: true }, 201);
});

// Public auth endpoints (login/logout/session check)
app.route("/api/auth", authRoutes);

// Admin routes — gated by built-in password session auth (worker/auth.ts)
app.use("/api/admin/*", adminAuth);
app.route("/api/admin", admin);

export default app;
