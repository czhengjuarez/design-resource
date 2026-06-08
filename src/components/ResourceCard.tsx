import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchRelated } from '../api';
import { badgeClass, cardClass } from '../keel';
import type { KeelBadgeVariant } from '../keel';
import type { Resource } from '../types';

const TYPE_META: Record<string, { label: string; variant: KeelBadgeVariant }> = {
  article:    { label: 'Article',    variant: 'default' },
  book:       { label: 'Book',       variant: 'blue' },
  talk:       { label: 'Talk',       variant: 'purple' },
  video:      { label: 'Video',      variant: 'purple' },
  tool:       { label: 'Tool',       variant: 'green' },
  person:     { label: 'Person',     variant: 'amber' },
  event:      { label: 'Event',      variant: 'green' },
  thread:     { label: 'Thread',     variant: 'default' },
  note:       { label: 'Note',       variant: 'default' },
  method:     { label: 'Method',     variant: 'blue' },
  podcast:    { label: 'Podcast',    variant: 'amber' },
  newsletter: { label: 'Newsletter', variant: 'amber' },
};

function hostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}

/** Inline "more like this" panel — toggled without triggering the card's outer link. */
function RelatedPanel({ resourceId }: { resourceId: number }) {
  const [open, setOpen] = useState(false);
  const relatedQuery = useQuery({
    queryKey: ['related', resourceId],
    queryFn: () => fetchRelated(resourceId),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
  };

  return (
    <div className="mt-3 -mb-1">
      <button
        onClick={toggle}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: 'var(--of-fg-brand)' }}
      >
        <Sparkles size={11} strokeWidth={1.75} />
        Related
        {open ? <ChevronUp size={11} strokeWidth={1.75} /> : <ChevronDown size={11} strokeWidth={1.75} />}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--of-border-subtle)' }}>
          {relatedQuery.isLoading && (
            <p className="text-xs" style={{ color: 'var(--of-fg-subtle)' }}>Finding similar resources…</p>
          )}
          {relatedQuery.data?.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--of-fg-subtle)' }}>Nothing closely related yet.</p>
          )}
          {relatedQuery.data?.map((r) => (
            <a
              key={r.id}
              href={r.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-xs hover:underline"
              style={{ color: 'var(--of-fg-muted)', textDecoration: 'none' }}
            >
              {r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const { url, title, description, author, type, tags } = resource;
  const meta = TYPE_META[type] ?? { label: type, variant: 'default' as KeelBadgeVariant };
  const host = url ? hostname(url) : null;

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={badgeClass({ variant: meta.variant })}>{meta.label}</span>
        {host && (
          <span className="flex items-center gap-1 truncate text-xs" style={{ color: 'var(--of-fg-subtle)' }}>
            <ExternalLink size={10} strokeWidth={1.75} />
            {host}
          </span>
        )}
      </div>
      <h3
        className="mt-3 line-clamp-2 break-words text-sm font-semibold leading-snug"
        style={{ color: 'var(--of-fg-default)' }}
      >
        {title}
      </h3>
      {author && (
        <p className="mt-1 text-xs" style={{ color: 'var(--of-fg-subtle)' }}>{author}</p>
      )}
      {description && (
        <p
          className="mt-2 line-clamp-3 break-words text-xs leading-relaxed"
          style={{ color: 'var(--of-fg-muted)' }}
        >
          {description}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className={badgeClass({ variant: 'default' })}>{t}</span>
          ))}
        </div>
      )}
      <RelatedPanel resourceId={resource.id} />
    </>
  );

  const base = cardClass({ className: 'flex flex-col transition-shadow' });

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={base} style={{ textDecoration: 'none' }}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
