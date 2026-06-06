import { ExternalLink } from 'lucide-react';
import { badgeClass } from '../keel';
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

export default function ResourceRow({ resource }: { resource: Resource }) {
  const { url, title, author, type } = resource;
  const meta = TYPE_META[type] ?? { label: type, variant: 'default' as KeelBadgeVariant };
  const host = url ? hostname(url) : null;

  const inner = (
    <div
      className="flex items-center gap-3 border-b px-1 py-3 transition-colors"
      style={{ borderColor: 'var(--of-border-subtle)' }}
    >
      <span className="w-24 shrink-0">
        <span className={badgeClass({ variant: meta.variant })}>{meta.label}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium"
          style={{ color: 'var(--of-fg-default)' }}
        >
          {title}
        </span>
        {author && (
          <span className="block truncate text-xs" style={{ color: 'var(--of-fg-subtle)' }}>
            {author}
          </span>
        )}
      </span>
      {host && (
        <span
          className="hidden shrink-0 items-center gap-1 text-xs sm:flex"
          style={{ color: 'var(--of-fg-subtle)' }}
        >
          <ExternalLink size={10} strokeWidth={1.75} />
          {host}
        </span>
      )}
    </div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}
