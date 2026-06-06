import type { CategoryNode, ResourcePage } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchCategories() {
  return getJson<{ categories: CategoryNode[] }>("/api/categories").then(
    (d) => d.categories,
  );
}

export interface ResourceQuery {
  category?: number | null;
  type?: string | null;
  q?: string;
  page?: number;
  limit?: number;
}

export function fetchResources(query: ResourceQuery) {
  const params = new URLSearchParams();
  if (query.category != null) params.set("category", String(query.category));
  if (query.type) params.set("type", query.type);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return getJson<ResourcePage>(`/api/resources${qs ? `?${qs}` : ""}`);
}
