import { ExternalLink } from 'lucide-react';
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
        className="mt-3 text-sm font-semibold leading-snug"
        style={{ color: 'var(--of-fg-default)' }}
      >
        {title}
      </h3>
      {author && (
        <p className="mt-1 text-xs" style={{ color: 'var(--of-fg-subtle)' }}>{author}</p>
      )}
      {description && (
        <p
          className="mt-2 line-clamp-3 text-xs leading-relaxed"
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
    </>
  );

  const base = cardClass({
    className: 'flex flex-col transition-shadow hover:shadow-md cursor-default',
  });

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={base}
      style={{ textDecoration: 'none' }}
    >
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
