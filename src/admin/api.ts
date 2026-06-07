import type { Resource, CategoryNode } from "../types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText })) as { error: string };
    throw new Error(err.error ?? r.statusText);
  }
  return r.json() as Promise<T>;
}

// Resources
export const adminApi = {
  listResources: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return req<{ items: Resource[]; total: number; page: number; hasMore: boolean }>(
      `/api/admin/resources${qs ? `?${qs}` : ""}`
    );
  },
  createResource: (body: Partial<Resource>) =>
    req<{ item: Resource }>("/api/admin/resources", { method: "POST", body: JSON.stringify(body) }),
  updateResource: (id: number, body: Partial<Resource>) =>
    req<{ item: Resource }>(`/api/admin/resources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteResource: (id: number) =>
    req<{ deleted: number }>(`/api/admin/resources/${id}`, { method: "DELETE" }),

  // Categories
  listCategories: () =>
    req<{ categories: (CategoryNode & { parentId: number | null })[] }>("/api/admin/categories"),
  createCategory: (body: { name: string; parentId?: number | null; icon?: string; description?: string }) =>
    req<{ category: CategoryNode }>("/api/admin/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id: number, body: { name?: string; icon?: string | null; description?: string | null; parentId?: number | null; sortOrder?: number }) =>
    req<{ category: CategoryNode }>(`/api/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteCategory: (id: number) =>
    req<{ deleted: number; reparentedTo: number | null }>(`/api/admin/categories/${id}`, { method: "DELETE" }),

  // Suggestions
  listSuggestions: () =>
    req<{ items: Resource[] }>("/api/admin/suggestions"),
  approveSuggestion: (id: number, edits?: Partial<Resource>) =>
    req<{ item: Resource }>(`/api/admin/suggestions/${id}/approve`, { method: "POST", body: JSON.stringify(edits ?? {}) }),
  rejectSuggestion: (id: number) =>
    req<{ rejected: number }>(`/api/admin/suggestions/${id}/reject`, { method: "POST", body: "{}" }),
};
