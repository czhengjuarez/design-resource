/**
 * Migrate a Coda doc into a D1 SQL seed file.
 *
 *   export CODA_API_TOKEN=...   export CODA_DOC_ID=dXXXXXXXX
 *   node scripts/import-coda.ts            # DRY RUN: prints plan, writes nothing
 *   node scripts/import-coda.ts --write    # writes db/seed/coda-import.sql
 *
 * Then apply:
 *   wrangler d1 execute design-resources --local  --file=db/seed/coda-import.sql
 *   wrangler d1 execute design-resources --remote --file=db/seed/coda-import.sql
 *
 * Strategy: the Coda page tree becomes the category hierarchy; each table is
 * attached to its parent page's category (via table.parent); table rows become
 * resources. Lookup/system/method tables are skipped (see classify()).
 * Idempotent: categories upsert on slug, resources upsert on coda_row_id.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import {
  listTables,
  getTable,
  listColumns,
  listRows,
  listPages,
  exportPageMarkdown,
  resolveDocId,
  type CodaColumn,
  type CodaPage,
  type CodaRow,
} from "./coda.ts";

// ---- Config -------------------------------------------------------------

/** Only pages under this root (by name) are imported; its children become top-level. */
const ROOT_PAGE_NAME = "About the Resource Section";

const IMPORT_METHODS = true; // collapse "Why/When" method tables into one card each
const IMPORT_PROSE = true; // export prose leaf pages (no table) as note cards
const PRUNE_EMPTY = true; // drop categories with no resources in their subtree
const PROSE_MIN_CHARS = 20; // ignore near-empty prose pages

/** Tables skipped entirely (lookup vocabularies, system/test, forms). */
const SKIP_TABLE_PATTERNS = [
  /^categor(y|ies)/i,
  /categor(y|ies)$/i,
  /\btags?$/i,
  /resource type/i,
  /resource or glossary term/i,
  /^levels?$/i,
  /pillar/i,
  /email template/i,
  /^copy of/i,
  /suggestion form/i,
  /\bfeedback\b/i,
  /agency rolodex/i,
  /template catalog/i, // synced pack table, not curated resources
];

/** Columns never used as resource content. */
const SKIP_COLUMN_TYPES = new Set(["person", "button", "reaction", "checkbox", "number"]);
const SKIP_COLUMN_NAMES = /^(added by|suggested by|recommended by|upvot|vote|done|approved|email sent|sort type|i read|i subscribe|synced|sync account|last updated)/i;

/** Title column preference (first present wins); else the table's displayColumn; else row.name. */
const TITLE_COLS = ["Title", "Name", "Article", "Articles", "Resource / Glossary Name", "Conference", "Resource Name/Link"];
const DESC_COLS = /why|note|review|description|^about$|areas|definition|^notes$/i;
const AUTHOR_COLS = /^author|^author\(s\)$|^author\/notes$/i;
const IMAGE_COL_NAMES = /cover|thumbnail|preview|image/i;
const LINK_COL_NAMES = /linkedin|browser link|portfolio|^rfp$|link to the resource/i;

// ---- Value parsing ------------------------------------------------------

const MD_LINK = /\[([^\]]*)\]\(([^)]+)\)/;

function stripFormatting(s: string): string {
  return s
    .replace(/^```|```$/g, "")
    .replace(/^#+\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

function firstUrlIn(s: string): string | null {
  const md = s.match(MD_LINK);
  if (md) return md[2].trim();
  const bare = s.match(/https?:\/\/[^\s)]+/);
  return bare ? bare[0] : null;
}

function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  u = u.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(u)) return "https://" + u; // bare domain like "juicebox.ai"
  return null; // garbled / relative -> drop, fix later in admin
}

/** Extract plain text from a Coda rich cell value. */
function cellToText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") {
    const md = v.match(MD_LINK);
    return stripFormatting(md ? md[1] : v);
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(cellToText).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.name === "string") return stripFormatting(o.name);
    return "";
  }
  return "";
}

/** Extract the first URL from a Coda rich cell value. */
function cellToUrl(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return normalizeUrl(firstUrlIn(v));
  if (Array.isArray(v)) {
    for (const item of v) {
      const u = cellToUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.url === "string") return normalizeUrl(o.url);
    if (typeof o.name === "string") return normalizeUrl(firstUrlIn(o.name));
  }
  return null;
}

// ---- Slugs --------------------------------------------------------------

const usedSlugs = new Set<string>();
function slugify(name: string, hint = ""): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item";
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${hint || n++}`.replace(/--+/g, "-");
  usedSlugs.add(slug);
  return slug;
}

// ---- Type inference -----------------------------------------------------

function inferType(tableName: string, categoryName: string, url: string | null): string {
  const hay = `${tableName} ${categoryName}`.toLowerCase();
  if (/book/.test(hay)) return "book";
  if (/podcast/.test(hay)) return "podcast";
  if (/newsletter/.test(hay)) return "newsletter";
  if (/people|to follow|speaker|rolodex/.test(hay)) return "person";
  if (/thread|slack|spaces/.test(hay)) return "thread";
  if (/conference|event|rfp/.test(hay)) return "event";
  if (/ted|talk/.test(hay) || /youtube\.com|youtu\.be/.test(url ?? "")) return "talk";
  if (/template|tooling|tool/.test(hay)) return "tool";
  return "article";
}

// ---- SQL helpers --------------------------------------------------------

function q(v: string | null): string {
  if (v == null || v === "") return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

// ---- Model --------------------------------------------------------------

interface Category {
  pageId: string;
  name: string;
  slug: string;
  parentPageId?: string;
  depth: number;
}
interface Resource {
  codaRowId: string;
  title: string;
  url: string | null;
  description: string | null;
  author: string | null;
  imageUrl: string | null;
  type: string;
  categorySlug: string;
}
interface ReportEntry {
  name: string;
  cls: string; // TableClass | "method"
  category?: string;
  imported?: number;
  rows?: number;
}

// ---- Table classification -----------------------------------------------

type TableClass = "resource" | "skip-pattern" | "skip-lookup" | "skip-method" | "out-of-scope";

function classify(name: string, cols: CodaColumn[]): TableClass {
  if (SKIP_TABLE_PATTERNS.some((re) => re.test(name))) return "skip-pattern";
  // Single-column tables are lookups only when the column is a vocabulary field;
  // a lone Title/Name/Article column is a real (if minimal) resource list.
  if (cols.length === 1) {
    return /categor|tags?|level|type|pillar|term/i.test(cols[0].name) ? "skip-lookup" : "resource";
  }
  // "Why do it? / When to do it?" method tables: exactly Title + Description.
  const names = cols.map((c) => c.name.toLowerCase()).sort().join(",");
  if (names === "description,title") return "skip-method";
  return "resource";
}

// ---- Main ---------------------------------------------------------------

async function main() {
  const docId = resolveDocId();
  if (!docId) throw new Error("Set CODA_DOC_ID (run discover-coda.ts to find it).");
  const write = process.argv.includes("--write");

  // 1) Pages -> category tree, scoped to ROOT_PAGE_NAME subtree.
  const pages = await listPages(docId);
  const pageById = new Map<string, CodaPage>(pages.map((p) => [p.id, p]));
  const root = pages.find((p) => p.name === ROOT_PAGE_NAME);
  if (!root) throw new Error(`Root page "${ROOT_PAGE_NAME}" not found.`);

  const inScope = new Set<string>();
  const isUnderRoot = (p: CodaPage): boolean => {
    let cur: CodaPage | undefined = p;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      if (cur.id === root.id) return true;
      seen.add(cur.id);
      cur = cur.parent ? pageById.get(cur.parent.id) : undefined;
    }
    return false;
  };
  for (const p of pages) if (p.id !== root.id && isUnderRoot(p)) inScope.add(p.id);

  const depthOf = (p: CodaPage): number => {
    let d = 0;
    let cur: CodaPage | undefined = p;
    while (cur?.parent && cur.parent.id !== root.id) {
      cur = pageById.get(cur.parent.id);
      d++;
    }
    return d;
  };

  const categories = new Map<string, Category>(); // pageId -> Category
  for (const p of pages) {
    if (!inScope.has(p.id)) continue;
    const parentPageId = p.parent && p.parent.id !== root.id ? p.parent.id : undefined;
    categories.set(p.id, {
      pageId: p.id,
      name: p.name,
      slug: slugify(p.name),
      parentPageId,
      depth: depthOf(p),
    });
  }

  // 2) Tables -> resources (+ collapse "method" tables into one card each).
  const tables = await listTables(docId);
  const resources: Resource[] = [];
  const report: ReportEntry[] = [];
  const pagesWithTables = new Set<string>();

  for (const t of tables) {
    const detail = await getTable(docId, t.id);
    const parentPageId = detail.parent?.id;
    if (parentPageId) pagesWithTables.add(parentPageId);
    const cols = await listColumns(docId, t.id);
    const cls = classify(t.name, cols);
    const ownCat = parentPageId ? categories.get(parentPageId) : undefined;

    if (cls === "skip-method" && IMPORT_METHODS) {
      if (!ownCat) {
        report.push({ name: t.name, cls: "out-of-scope" });
        continue;
      }
      const rows = await listRows(docId, t.id);
      const r = collapseMethod(t.id, rows, ownCat, categories);
      if (r) {
        resources.push(r);
        const target = [...categories.values()].find((c) => c.slug === r.categorySlug)?.name ?? r.categorySlug;
        report.push({ name: t.name, cls: "method", category: target, imported: 1, rows: rows.length });
      } else {
        report.push({ name: t.name, cls: "skip-method" });
      }
      continue;
    }
    if (cls !== "resource") {
      report.push({ name: t.name, cls, category: ownCat?.name });
      continue;
    }
    if (!ownCat) {
      report.push({ name: t.name, cls: "out-of-scope" });
      continue;
    }

    const rows = await listRows(docId, t.id);
    const titleCol = TITLE_COLS.find((tc) => cols.some((c) => c.name === tc));
    let imported = 0;
    for (const row of rows) {
      const r = mapRow(row, cols, titleCol, t.id, t.name, ownCat);
      if (r) {
        resources.push(r);
        imported++;
      }
    }
    report.push({ name: t.name, cls, category: ownCat.name, imported, rows: rows.length });
  }

  // 3) Prose leaf pages (no table) -> note cards via Markdown export.
  let proseCount = 0;
  if (IMPORT_PROSE) {
    const childCount = new Map<string, number>();
    for (const p of pages)
      if (inScope.has(p.id) && p.parent)
        childCount.set(p.parent.id, (childCount.get(p.parent.id) ?? 0) + 1);

    for (const p of pages) {
      if (!inScope.has(p.id) || pagesWithTables.has(p.id)) continue;
      if ((childCount.get(p.id) ?? 0) > 0) continue; // not a leaf
      let md: string;
      try {
        md = await exportPageMarkdown(docId, p.id);
      } catch {
        continue;
      }
      const text = cleanMarkdown(md);
      if (text.replace(/\s+/g, "").length < PROSE_MIN_CHARS) continue; // ~empty page
      const parentCat =
        p.parent && p.parent.id !== root.id ? categories.get(p.parent.id) : categories.get(p.id);
      if (!parentCat) continue;
      resources.push({
        codaRowId: `page:${p.id}`,
        title: p.name.slice(0, 500),
        url: normalizeUrl(firstUrlIn(md)),
        description: text.slice(0, 2000),
        author: null,
        imageUrl: null,
        type: "note",
        categorySlug: parentCat.slug,
      });
      proseCount++;
    }
  }

  // 4) Prune categories that have no resources in their subtree.
  const kept = PRUNE_EMPTY ? pruneEmpty(categories, resources) : categories;

  printReport(kept, report, resources, proseCount, categories.size);

  if (!write) {
    console.log(`\n(DRY RUN) Re-run with --write to generate db/seed/coda-import.sql\n`);
    return;
  }

  const sql = buildSql([...kept.values()], resources);
  mkdirSync("db/seed", { recursive: true });
  writeFileSync("db/seed/coda-import.sql", sql);
  console.log(`\n✅ Wrote db/seed/coda-import.sql (${kept.size} categories, ${resources.length} resources)\n`);
}

/** Collapse a "Why do it? / When to do it?" method table into one resource card. */
function collapseMethod(
  tableId: string,
  rows: CodaRow[],
  methodCat: Category,
  categories: Map<string, Category>,
): Resource | null {
  // The method's own page is methodCat; place the card in its parent category.
  const parentCat =
    (methodCat.parentPageId && categories.get(methodCat.parentPageId)) || methodCat;
  const parts: string[] = [];
  for (const row of rows) {
    const label = cellToText(row.name);
    const body = cellToText(row.values["Description"]);
    if (body) parts.push(label ? `${label} ${body}` : body);
  }
  const description = parts.join("\n\n").slice(0, 2000);
  if (!description) return null;
  return {
    codaRowId: `method:${tableId}`,
    title: methodCat.name.slice(0, 500),
    url: null,
    description,
    author: null,
    imageUrl: null,
    type: "method",
    categorySlug: parentCat.slug,
  };
}

function cleanMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // strip images
    .replace(/^#{1,6}\s*/gm, "") // strip heading markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Keep only categories that contain a resource, plus their ancestors. */
function pruneEmpty(
  categories: Map<string, Category>,
  resources: Resource[],
): Map<string, Category> {
  const slugHas = new Set(resources.map((r) => r.categorySlug));
  const keepPages = new Set<string>();
  for (const c of categories.values()) {
    if (!slugHas.has(c.slug)) continue;
    let cur: Category | undefined = c;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.pageId)) {
      keepPages.add(cur.pageId);
      seen.add(cur.pageId);
      cur = cur.parentPageId ? categories.get(cur.parentPageId) : undefined;
    }
  }
  const out = new Map<string, Category>();
  for (const [id, c] of categories) if (keepPages.has(id)) out.set(id, c);
  return out;
}

function mapRow(
  row: CodaRow,
  cols: CodaColumn[],
  titleCol: string | undefined,
  tableId: string,
  tableName: string,
  category: Category,
): Resource | null {
  const colType = (n: string) => cols.find((c) => c.name === n)?.format?.type ?? "text";

  // Title + URL from the title column (markdown link), else row.name.
  const titleRaw = titleCol ? row.values[titleCol] : undefined;
  let title = cellToText(titleRaw) || cellToText(row.name) || "";
  let url = cellToUrl(titleRaw) ?? cellToUrl(row.name);

  // URL fallback: dedicated link columns.
  if (!url) {
    for (const c of cols) {
      if (colType(c.name) === "link" || LINK_COL_NAMES.test(c.name)) {
        url = cellToUrl(row.values[c.name]);
        if (url) break;
      }
    }
  }

  if (!title) return null; // skip blank rows

  // Description / author / image.
  let description: string | null = null;
  let author: string | null = null;
  let imageUrl: string | null = null;
  for (const c of cols) {
    if (SKIP_COLUMN_NAMES.test(c.name)) continue;
    const type = colType(c.name);
    const val = row.values[c.name];
    if ((type === "image" || IMAGE_COL_NAMES.test(c.name)) && !imageUrl) {
      imageUrl = cellToUrl(val);
      continue;
    }
    if (SKIP_COLUMN_TYPES.has(type)) continue;
    if (c.name === titleCol) continue;
    if (!author && AUTHOR_COLS.test(c.name)) author = cellToText(val) || null;
    else if (!description && DESC_COLS.test(c.name)) {
      const txt = cellToText(val);
      if (txt) description = txt.slice(0, 2000);
    }
  }

  return {
    codaRowId: `${tableId}:${row.id}`, // row ids are unique per-table, not globally
    title: title.slice(0, 500),
    url,
    description,
    author,
    imageUrl,
    type: inferType(tableName, category.name, url),
    categorySlug: category.slug,
  };
}

function buildSql(categories: Category[], resources: Resource[]): string {
  const lines: string[] = [
    "-- Generated by scripts/import-coda.ts. Idempotent: safe to re-apply.",
    "PRAGMA foreign_keys = ON;",
    "",
    "-- Categories (ordered by depth so parents exist before children).",
  ];
  const bySlug = new Map(categories.map((c) => [c.pageId, c]));
  for (const c of [...categories].sort((a, b) => a.depth - b.depth)) {
    const parentSlug = c.parentPageId ? bySlug.get(c.parentPageId)?.slug : undefined;
    const parentSel = parentSlug ? `(SELECT id FROM categories WHERE slug=${q(parentSlug)})` : "NULL";
    lines.push(
      `INSERT INTO categories (name, slug, parent_id, sort_order) VALUES (${q(c.name)}, ${q(c.slug)}, ${parentSel}, ${c.depth}) ` +
        `ON CONFLICT(slug) DO UPDATE SET name=excluded.name, parent_id=excluded.parent_id, updated_at=current_timestamp;`,
    );
  }
  lines.push("", "-- Resources (upsert on coda_row_id).");
  for (const r of resources) {
    const catSel = `(SELECT id FROM categories WHERE slug=${q(r.categorySlug)})`;
    lines.push(
      `INSERT INTO resources (coda_row_id, title, description, url, category_id, type, author, image_url, source, status) VALUES (` +
        `${q(r.codaRowId)}, ${q(r.title)}, ${q(r.description)}, ${q(r.url)}, ${catSel}, ${q(r.type)}, ${q(r.author)}, ${q(r.imageUrl)}, 'coda', 'published') ` +
        `ON CONFLICT(coda_row_id) DO UPDATE SET title=excluded.title, description=excluded.description, url=excluded.url, ` +
        `category_id=excluded.category_id, type=excluded.type, author=excluded.author, image_url=excluded.image_url, updated_at=current_timestamp;`,
    );
  }
  return lines.join("\n") + "\n";
}

function printReport(
  categories: Map<string, Category>,
  report: ReportEntry[],
  resources: Resource[],
  proseCount: number,
  totalCatsBeforePrune: number,
) {
  console.log(`\n=== CATEGORY TREE (${categories.size} kept of ${totalCatsBeforePrune}) ===`);
  const byDepth = [...categories.values()].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
  for (const c of byDepth) console.log(`${"  ".repeat(c.depth)}• ${c.name}  (${c.slug})`);

  const tableRes = report.filter((r) => r.cls === "resource");
  console.log(`\n=== RESOURCE TABLES (${tableRes.length}) ===`);
  for (const r of tableRes.sort((a, b) => (b.imported ?? 0) - (a.imported ?? 0)))
    console.log(`  ${String(r.imported).padStart(4)} / ${String(r.rows).padStart(4)} rows  ${r.name}  -> ${r.category}`);

  const methods = report.filter((r) => r.cls === "method");
  console.log(`\n=== METHOD CARDS (${methods.length}) ===`);
  for (const r of methods) console.log(`  ${r.name}  -> ${r.category}`);

  console.log(`\n=== PROSE NOTE CARDS: ${proseCount} (from leaf pages with no table) ===`);

  const skipped = report.filter((r) => r.cls !== "resource" && r.cls !== "method");
  console.log(`\n=== SKIPPED TABLES (${skipped.length}) ===`);
  for (const r of skipped) console.log(`  [${r.cls}]  ${r.name}`);

  const byType = new Map<string, number>();
  for (const r of resources) byType.set(r.type, (byType.get(r.type) ?? 0) + 1);
  console.log(
    `\nTOTAL: ${categories.size} categories, ${resources.length} resources ` +
      `(${[...byType.entries()].map(([t, n]) => `${t}:${n}`).join(", ")}).`,
  );
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
