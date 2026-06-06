import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Sun, Moon, Monitor, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCategories, fetchResources } from './api';
import CategorySidebar from './components/CategorySidebar';
import ResourceCard from './components/ResourceCard';
import ResourceRow from './components/ResourceRow';
import { buttonClass, inputClass, selectClass } from './keel';
import { useTheme } from './hooks/useTheme';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'article', label: 'Articles' },
  { value: 'book', label: 'Books' },
  { value: 'talk', label: 'Talks' },
  { value: 'video', label: 'Videos' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'newsletter', label: 'Newsletters' },
  { value: 'tool', label: 'Tools' },
  { value: 'method', label: 'Methods' },
  { value: 'person', label: 'People' },
  { value: 'event', label: 'Events' },
  { value: 'thread', label: 'Threads' },
  { value: 'note', label: 'Notes' },
];

const LIMIT = 24;

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return d;
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const set = (next: T) => {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [value, set] as const;
}

function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (t: 'light' | 'dark' | 'system') => void }) {
  const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode }[] = [
    { value: 'light',  icon: <Sun size={14} strokeWidth={1.75} /> },
    { value: 'dark',   icon: <Moon size={14} strokeWidth={1.75} /> },
    { value: 'system', icon: <Monitor size={14} strokeWidth={1.75} /> },
  ];
  return (
    <div
      className="flex items-center rounded-md p-0.5 gap-0.5"
      style={{ background: 'var(--of-bg-recessed)', border: '1px solid var(--of-border-line)' }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          title={o.value}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
          style={{
            background: theme === o.value ? 'var(--of-bg-elevated)' : 'transparent',
            color: theme === o.value ? 'var(--of-fg-brand)' : 'var(--of-fg-subtle)',
            boxShadow: theme === o.value ? 'var(--of-shadow-xs)' : 'none',
          }}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useLocalStorage<'card' | 'list'>('view', 'card');
  const [category, setCategory] = useState<number | null>(null);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const q = useDebounced(search, 280);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setPage(1), [category, type, q]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const resourcesQuery = useQuery({
    queryKey: ['resources', { category, type, q, page }],
    queryFn: () => fetchResources({ category, type: type || null, q, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const page_ = resourcesQuery.data;
  const totalPages = page_ ? Math.max(1, Math.ceil(page_.total / LIMIT)) : 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--of-bg-base)', color: 'var(--of-fg-default)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--of-bg-base) 90%, transparent)',
          borderColor: 'var(--of-border-line)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          {/* Mobile filter button */}
          <button
            className="flex items-center gap-1.5 md:hidden"
            style={{ color: 'var(--of-fg-muted)' }}
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} />
          </button>

          <h1
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: 'var(--of-font-display)', color: 'var(--of-fg-default)' }}
          >
            Design Resources
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className={inputClass({ className: 'w-40 sm:w-56' })}
              style={{ height: '34px', padding: '0 10px' }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={selectClass({ className: 'hidden sm:block w-36' })}
              style={{ height: '34px', padding: '0 8px' }}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div
              className="flex items-center rounded-md p-0.5 gap-0.5"
              style={{ background: 'var(--of-bg-recessed)', border: '1px solid var(--of-border-line)' }}
            >
              <button
                onClick={() => setView('card')}
                title="Card view"
                className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                style={{
                  background: view === 'card' ? 'var(--of-bg-elevated)' : 'transparent',
                  color: view === 'card' ? 'var(--of-fg-brand)' : 'var(--of-fg-subtle)',
                  boxShadow: view === 'card' ? 'var(--of-shadow-xs)' : 'none',
                }}
              >
                <LayoutGrid size={14} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setView('list')}
                title="List view"
                className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                style={{
                  background: view === 'list' ? 'var(--of-bg-elevated)' : 'transparent',
                  color: view === 'list' ? 'var(--of-fg-brand)' : 'var(--of-fg-subtle)',
                  boxShadow: view === 'list' ? 'var(--of-shadow-xs)' : 'none',
                }}
              >
                <List size={14} strokeWidth={1.75} />
              </button>
            </div>

            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div
            ref={drawerRef}
            className="relative w-72 overflow-y-auto p-4"
            style={{ background: 'var(--of-bg-elevated)', borderRight: '1px solid var(--of-border-line)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--of-fg-default)' }}>Browse</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className={buttonClass({ variant: 'ghost', size: 'sm' })}
                style={{ padding: '0 6px' }}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="mb-4">
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setDrawerOpen(false); }}
                className={selectClass()}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {categoriesQuery.data && (
              <CategorySidebar
                categories={categoriesQuery.data}
                selectedId={category}
                onSelect={(id) => { setCategory(id); setDrawerOpen(false); }}
              />
            )}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
            {categoriesQuery.data && (
              <CategorySidebar
                categories={categoriesQuery.data}
                selectedId={category}
                onSelect={setCategory}
              />
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div
            className="mb-4 flex items-center justify-between text-xs"
            style={{ color: 'var(--of-fg-subtle)' }}
          >
            <span>
              {resourcesQuery.isLoading
                ? 'Loading…'
                : `${page_?.total ?? 0} resource${page_?.total === 1 ? '' : 's'}`}
            </span>
          </div>

          {resourcesQuery.isError && (
            <p style={{ color: 'var(--of-fg-danger)' }}>Failed to load resources.</p>
          )}

          {page_ && page_.items.length === 0 && !resourcesQuery.isLoading && (
            <p style={{ color: 'var(--of-fg-subtle)' }}>No resources match these filters.</p>
          )}

          {view === 'card' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page_?.items.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ) : (
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--of-border-line)', background: 'var(--of-bg-elevated)' }}
            >
              {page_?.items.map((r) => <ResourceRow key={r.id} resource={r} />)}
            </div>
          )}

          {page_ && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                <ChevronLeft size={14} strokeWidth={1.75} /> Prev
              </button>
              <span className="text-sm" style={{ color: 'var(--of-fg-subtle)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!page_.hasMore}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Next <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
