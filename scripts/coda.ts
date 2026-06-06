/**
 * Minimal Coda REST API client (https://coda.io/developers/apis/v1).
 * Read-only helpers used by discover-coda.ts and import-coda.ts.
 *
 * Auth: set CODA_API_TOKEN (coda.io -> Account Settings -> API).
 * Optional: set CODA_DOC_ID to target a specific doc.
 *
 * Runs on Node 26 with native TypeScript (no build step): `node scripts/<file>.ts`.
 */

const BASE = "https://coda.io/apis/v1";

export function getToken(): string {
  const token = process.env.CODA_API_TOKEN;
  if (!token) {
    throw new Error(
      "Missing CODA_API_TOKEN. Get one at coda.io -> Account Settings -> API, then:\n" +
        "  export CODA_API_TOKEN=your-token",
    );
  }
  return token;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  // Simple retry/backoff for 429 (rate limit) and transient 5xx.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (attempt >= 5) throw new Error(`Coda API ${res.status} after retries: ${url}`);
      const retryAfter = Number(res.headers.get("Retry-After")) || 2 ** attempt;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Coda API ${res.status} ${res.statusText}: ${url}\n${await res.text()}`);
    }
    return (await res.json()) as T;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Types (only the fields we use) -------------------------------------

export interface CodaDoc {
  id: string;
  name: string;
  browserLink?: string;
}
export interface CodaTable {
  id: string;
  name: string;
  rowCount?: number;
  tableType?: string;
}
export interface CodaTableDetail extends CodaTable {
  parent?: { id: string; name?: string; type?: string };
  displayColumn?: { id: string; name?: string };
}
export interface CodaColumn {
  id: string;
  name: string;
  format?: { type?: string };
}
export interface CodaRow {
  id: string;
  name?: string;
  index?: number;
  browserLink?: string;
  values: Record<string, unknown>;
}
export interface CodaPage {
  id: string;
  name: string;
  contentType?: string;
  parent?: { id: string; name?: string };
  children?: { id: string }[];
  browserLink?: string;
}

interface ListResponse<T> {
  items: T[];
  nextPageLink?: string;
  nextPageToken?: string;
}

// ---- Paginated list helper ----------------------------------------------

async function listAll<T>(firstPath: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined = firstPath;
  while (next) {
    const page: ListResponse<T> = await api<ListResponse<T>>(next);
    out.push(...page.items);
    next = page.nextPageLink; // absolute URL when present
  }
  return out;
}

// ---- Endpoints -----------------------------------------------------------

export function listDocs(): Promise<CodaDoc[]> {
  return listAll<CodaDoc>("/docs?limit=100");
}

export function listTables(docId: string): Promise<CodaTable[]> {
  // tableTypes=table excludes views (which duplicate base-table data).
  return listAll<CodaTable>(`/docs/${docId}/tables?tableTypes=table&limit=100`);
}

/** Full table detail (includes `parent` page reference and `displayColumn`). */
export function getTable(docId: string, tableId: string): Promise<CodaTableDetail> {
  return api<CodaTableDetail>(`/docs/${docId}/tables/${tableId}`);
}

export function listColumns(docId: string, tableId: string): Promise<CodaColumn[]> {
  return listAll<CodaColumn>(`/docs/${docId}/tables/${tableId}/columns?limit=100`);
}

export function listRows(docId: string, tableId: string): Promise<CodaRow[]> {
  // useColumnNames -> values keyed by human column name; valueFormat=rich keeps links/urls.
  return listAll<CodaRow>(
    `/docs/${docId}/tables/${tableId}/rows?useColumnNames=true&valueFormat=rich&limit=200`,
  );
}

export function listPages(docId: string): Promise<CodaPage[]> {
  return listAll<CodaPage>(`/docs/${docId}/pages?limit=100`);
}

/** Export a page's canvas content as Markdown (async job + poll + download). */
export async function exportPageMarkdown(docId: string, pageId: string): Promise<string> {
  const token = getToken();
  const begin = await api<{ id: string; status?: string; href?: string }>(
    `/docs/${docId}/pages/${pageId}/export`,
    { method: "POST", body: JSON.stringify({ outputFormat: "markdown" }) },
  );
  const statusUrl = begin.href ?? `${BASE}/docs/${docId}/pages/${pageId}/export/${begin.id}`;

  // Poll. The status endpoint can 404 briefly until the job registers, so we
  // tolerate 404/202 as "not ready yet" rather than failing.
  for (let i = 0; i < 40; i++) {
    await sleep(i === 0 ? 800 : 1500);
    const res = await fetch(statusUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404 || res.status === 202) continue;
    if (res.status === 429 || res.status >= 500) continue;
    if (!res.ok) throw new Error(`Page export ${res.status}: ${pageId}\n${await res.text()}`);
    const status = (await res.json()) as { status?: string; downloadLink?: string };
    if (status.status === "complete" && status.downloadLink) {
      return await (await fetch(status.downloadLink)).text();
    }
    if (status.status === "failed") throw new Error(`Page export failed: ${pageId}`);
  }
  throw new Error(`Page export timed out: ${pageId}`);
}

export function resolveDocId(): string | undefined {
  return process.env.CODA_DOC_ID;
}
