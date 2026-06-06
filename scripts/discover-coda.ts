/**
 * READ-ONLY discovery of a Coda doc's structure. Writes nothing.
 *
 * Usage:
 *   export CODA_API_TOKEN=your-token
 *   node scripts/discover-coda.ts                 # lists your docs (pick a doc id)
 *   export CODA_DOC_ID=dXXXXXXXX
 *   node scripts/discover-coda.ts                 # tables, columns, sample rows, page tree
 *   node scripts/discover-coda.ts --page <pageId> # dump one page's content as Markdown
 */

import {
  listDocs,
  listTables,
  listColumns,
  listRows,
  listPages,
  exportPageMarkdown,
  resolveDocId,
  type CodaPage,
} from "./coda.ts";

function truncate(v: unknown, n = 80): string {
  let s: string;
  if (v == null) s = "";
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  s = s.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function main() {
  const docId = resolveDocId();

  // No doc id -> list docs so the user can pick one.
  if (!docId) {
    const docs = await listDocs();
    console.log(`\nYour Coda docs (${docs.length}). Set CODA_DOC_ID to one of these:\n`);
    for (const d of docs) {
      console.log(`  ${d.id}\t${d.name}${d.browserLink ? `  (${d.browserLink})` : ""}`);
    }
    console.log("\n  export CODA_DOC_ID=<id>  then re-run.\n");
    return;
  }

  const pageArg = process.argv.indexOf("--page");
  if (pageArg !== -1) {
    const pageId = process.argv[pageArg + 1];
    if (!pageId) throw new Error("--page requires a page id");
    console.log(`\n--- Markdown export of page ${pageId} ---\n`);
    const md = await exportPageMarkdown(docId, pageId);
    console.log(md.slice(0, 4000));
    if (md.length > 4000) console.log(`\n…(${md.length} chars total, truncated)`);
    return;
  }

  // ---- Tables ----
  const tables = await listTables(docId);
  console.log(`\n=== TABLES (${tables.length}) ===`);
  for (const t of tables) {
    const cols = await listColumns(docId, t.id);
    const rows = await listRows(docId, t.id);
    console.log(`\n▸ ${t.name}  [${t.id}]  rows=${rows.length}`);
    console.log(`  columns: ${cols.map((c) => `${c.name}<${c.format?.type ?? "?"}>`).join(", ")}`);
    rows.slice(0, 2).forEach((r, i) => {
      console.log(`  sample[${i}] name="${truncate(r.name, 40)}"`);
      for (const c of cols) {
        const val = truncate(r.values[c.name]);
        if (val) console.log(`     ${c.name}: ${val}`);
      }
    });
  }

  // ---- Pages (tree) ----
  const pages = await listPages(docId);
  const byParent = new Map<string | undefined, CodaPage[]>();
  for (const p of pages) {
    const key = p.parent?.id;
    (byParent.get(key) ?? byParent.set(key, []).get(key)!).push(p);
  }
  console.log(`\n=== PAGES (${pages.length}) ===`);
  const printTree = (parentId: string | undefined, depth: number) => {
    for (const p of byParent.get(parentId) ?? []) {
      console.log(`${"  ".repeat(depth + 1)}${p.name}  [${p.id}]  type=${p.contentType ?? "?"}`);
      printTree(p.id, depth + 1);
    }
  };
  printTree(undefined, 0);

  console.log(
    `\nNext: identify which tables hold resources, and which pages are prose lists.\n` +
      `Dump a prose page with:  node scripts/discover-coda.ts --page <pageId>\n`,
  );
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
