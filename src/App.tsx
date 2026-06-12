import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Sun, Moon, Monitor, SlidersHorizontal, X, ChevronLeft, ChevronRight, Plus, Sparkles, ListFilter, Library } from 'lucide-react';
import { fetchCategories, fetchResources, fetchSmartSearch } from './api';
import CategorySidebar from './components/CategorySidebar';
import ResourceCard from './components/ResourceCard';
import ResourceRow from './components/ResourceRow';
import { buttonClass, inputClass, selectClass } from './keel';
import { useTheme } from './hooks/useTheme';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'article', label: 'Articles' },
  { value: 'book', label: 'Books' },
  { value: 'event', label: 'Events' },
  { value: 'method', label: 'Methods' },
  { value: 'newsletter', label: 'Newsletters' },
  { value: 'note', label: 'Notes' },
  { value: 'person', label: 'People' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'talk', label: 'Talks' },
  { value: 'thread', label: 'Threads' },
  { value: 'tool', label: 'Tools' },
  { value: 'video', label: 'Videos' },
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
  const [smartMode, setSmartMode] = useLocalStorage('smartSearch', false);
  const q = useDebounced(search, 280);
  // Smart search costs an AI embedding call per query — debounce harder so we
  // don't fire one on every keystroke.
  const smartQ = useDebounced(search, 700);
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
    enabled: !smartMode,
  });

  const smartQuery = useQuery({
    queryKey: ['smart-search', smartQ],
    queryFn: () => fetchSmartSearch(smartQ, 36),
    enabled: smartMode && smartQ.trim().length > 0,
    placeholderData: keepPreviousData,
  });

  const page_ = resourcesQuery.data;
  const totalPages = page_ ? Math.max(1, Math.ceil(page_.total / LIMIT)) : 1;

  // Unify the two modes behind one shape the render below already understands.
  const results = smartMode
    ? { items: smartQuery.data?.items ?? [], total: smartQuery.data?.total ?? 0 }
    : { items: page_?.items ?? [], total: page_?.total ?? 0 };
  const isLoading = smartMode ? smartQuery.isFetching : resourcesQuery.isLoading;
  const isError = smartMode ? smartQuery.isError : resourcesQuery.isError;
  const showEmpty = smartMode
    ? smartMode && smartQ.trim().length > 0 && !smartQuery.isFetching && results.items.length === 0
    : !!page_ && page_.items.length === 0 && !resourcesQuery.isLoading;

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
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5">
          {/* Title row — title/actions on the left, view & theme toggles pinned
              right. flex-wrap lets the right-hand group drop to its own line
              on narrow screens instead of overflowing past the search row's
              width below it. */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile filter button */}
            <button
              className="flex items-center gap-1.5 md:hidden"
              style={{ color: 'var(--of-fg-muted)' }}
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} />
            </button>

            <h1
              className="flex shrink-0 items-center gap-1.5 text-base font-semibold tracking-tight"
              style={{ fontFamily: 'var(--of-font-display)', color: 'var(--of-fg-default)' }}
            >
              <Library size={18} strokeWidth={1.75} style={{ color: 'var(--of-fg-brand)' }} />
              Design Resources
            </h1>

            <a
              href="/about"
              className="ml-1 hidden shrink-0 text-sm font-medium sm:inline-flex"
              style={{ color: 'var(--of-fg-subtle)' }}
            >
              About
            </a>

            <a
              href="/suggest"
              className="hidden shrink-0 items-center gap-1.5 text-sm font-medium sm:inline-flex"
              style={{ color: 'var(--of-fg-subtle)' }}
            >
              <Plus size={14} strokeWidth={1.75} style={{ color: 'var(--of-fg-brand)' }} /> Suggest a resource
            </a>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="relative shrink-0">
                <ListFilter
                  size={14}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--of-fg-subtle)', opacity: smartMode ? 0.5 : 1 }}
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={smartMode}
                  aria-label="Filter by resource type"
                  title={smartMode ? 'Type filter is unavailable in Smart search — it ranks across everything by meaning' : 'Filter by resource type'}
                  className={selectClass({ className: '!w-28 sm:!w-36' })}
                  style={{ height: '34px', padding: '0 8px 0 26px', opacity: smartMode ? 0.5 : 1 }}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* View toggle */}
              <div
                className="flex shrink-0 items-center rounded-md p-0.5 gap-0.5"
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

          {/* Search row — input gets the full header width to itself, with
              the Smart toggle as its mode switch right alongside it. */}
          <div className="flex items-center gap-2 md:gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={smartMode ? 'Describe what you want…' : 'Search…'}
              className={inputClass({ className: 'min-w-0 flex-1' })}
              style={{ height: '34px', padding: '0 10px' }}
            />
            <button
              onClick={() => setSmartMode(!smartMode)}
              title={smartMode ? 'Smart search on — ranks by meaning, not keywords' : 'Turn on Smart search (AI-ranked by meaning)'}
              className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
              style={{
                background: smartMode ? 'var(--of-bg-brand-tint)' : 'var(--of-bg-recessed)',
                color: smartMode ? 'var(--of-fg-brand)' : 'var(--of-fg-subtle)',
                border: `1px solid ${smartMode ? 'color-mix(in srgb, var(--of-magenta-400) 35%, transparent)' : 'var(--of-border-line)'}`,
              }}
            >
              <Sparkles size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Smart</span>
            </button>
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
            <a
              href="/suggest"
              className={buttonClass({ variant: 'tint', size: 'sm', className: 'mt-4 w-full justify-center' })}
            >
              <Plus size={14} strokeWidth={1.75} /> Suggest a resource
            </a>
            <a
              href="/about"
              className={buttonClass({ variant: 'ghost', size: 'sm', className: 'mt-2 w-full justify-center' })}
            >
              About
            </a>
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
          {smartMode && (
            <div
              className="mb-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm"
              style={{
                background: 'var(--of-bg-brand-tint)',
                borderColor: 'color-mix(in srgb, var(--of-magenta-400) 30%, transparent)',
                color: 'var(--of-fg-brand)',
              }}
            >
              <Sparkles size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>
                <strong>Smart search</strong> ranks results by meaning rather than exact keyword
                matches — try describing what you're after, e.g. "building trust with engineers"
                or "running a design critique". Category and type filters are off while it's on.
              </span>
            </div>
          )}

          <div
            className="mb-4 flex items-center justify-between text-xs"
            style={{ color: 'var(--of-fg-subtle)' }}
          >
            <span>
              {smartMode && !smartQ.trim()
                ? 'Type something to search by meaning…'
                : isLoading
                ? 'Loading…'
                : `${results.total} resource${results.total === 1 ? '' : 's'}`}
            </span>
          </div>

          {isError && (
            <p style={{ color: 'var(--of-fg-danger)' }}>Failed to load resources.</p>
          )}

          {showEmpty && (
            <p style={{ color: 'var(--of-fg-subtle)' }}>
              {smartMode ? 'Nothing ranked closely enough — try rephrasing.' : 'No resources match these filters.'}
            </p>
          )}

          {view === 'card' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ) : (
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--of-border-line)', background: 'var(--of-bg-elevated)' }}
            >
              {results.items.map((r) => <ResourceRow key={r.id} resource={r} />)}
            </div>
          )}

          {!smartMode && page_ && totalPages > 1 && (
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
