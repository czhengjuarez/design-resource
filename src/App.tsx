import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchResources } from "./api";
import CategorySidebar from "./components/CategorySidebar";
import ResourceCard from "./components/ResourceCard";

const TYPES = [
  { value: "", label: "All types" },
  { value: "article", label: "Articles" },
  { value: "book", label: "Books" },
  { value: "talk", label: "Talks" },
  { value: "video", label: "Videos" },
  { value: "podcast", label: "Podcasts" },
  { value: "newsletter", label: "Newsletters" },
  { value: "tool", label: "Tools" },
  { value: "method", label: "Methods" },
  { value: "person", label: "People" },
  { value: "event", label: "Events" },
  { value: "thread", label: "Threads" },
  { value: "note", label: "Notes" },
];

const LIMIT = 24;

/** Debounce a fast-changing value so we don't query on every keystroke. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function App() {
  const [category, setCategory] = useState<number | null>(null);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search, 250);

  // Any filter change resets to the first page.
  useEffect(() => setPage(1), [category, type, q]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const resourcesQuery = useQuery({
    queryKey: ["resources", { category, type, q, page }],
    queryFn: () =>
      fetchResources({ category, type: type || null, q, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const page_ = resourcesQuery.data;
  const totalPages = page_ ? Math.max(1, Math.ceil(page_.total / LIMIT)) : 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">Design Resources</h1>
          <div className="ml-auto flex flex-1 items-center justify-end gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, authors…"
              className="w-full max-w-xs rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500/60 focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 focus:border-emerald-500/60 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            {categoriesQuery.data && (
              <CategorySidebar
                categories={categoriesQuery.data}
                selectedId={category}
                onSelect={setCategory}
              />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between text-sm text-neutral-400">
            <span>
              {resourcesQuery.isLoading
                ? "Loading…"
                : `${page_?.total ?? 0} resource${page_?.total === 1 ? "" : "s"}`}
            </span>
          </div>

          {resourcesQuery.isError && (
            <p className="text-red-400">Failed to load resources.</p>
          )}

          {page_ && page_.items.length === 0 && !resourcesQuery.isLoading && (
            <p className="text-neutral-500">No resources match these filters.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page_?.items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>

          {page_ && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-300 disabled:opacity-40 enabled:hover:bg-neutral-800"
              >
                ← Prev
              </button>
              <span className="text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!page_.hasMore}
                className="rounded-lg border border-neutral-800 px-3 py-1.5 text-neutral-300 disabled:opacity-40 enabled:hover:bg-neutral-800"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
