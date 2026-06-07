import { ExternalLink, Link2 } from 'lucide-react';
import { badgeClass, cardClass, buttonClass } from '../keel';
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

function initials(name: string) {
  return name
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function PersonCard({ resource }: { resource: Resource }) {
  const { url, title, description, tags } = resource;
  const isLinkedIn = url?.includes('linkedin.com');

  return (
    <div
      className={cardClass({ className: 'flex flex-col gap-3' })}
      style={{ minHeight: '140px' }}
    >
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: 'var(--of-bg-brand-tint)',
            color: 'var(--of-fg-brand)',
            border: '1px solid color-mix(in srgb, var(--of-magenta-400) 25%, transparent)',
            fontFamily: 'var(--of-font-display)',
          }}
        >
          {initials(title)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-semibold leading-tight"
            style={{ color: 'var(--of-fg-default)', fontSize: 'var(--of-text-sm)' }}
          >
            {title}
          </p>
          {description && (
            <p
              className="mt-0.5 line-clamp-1 text-xs leading-snug"
              style={{ color: 'var(--of-fg-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Specialty tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className={badgeClass({ variant: 'purple' })}>{t}</span>
          ))}
        </div>
      )}

      {/* Link */}
      {url && (
        <div className="mt-auto pt-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={buttonClass({ variant: 'tint', size: 'sm', className: 'w-full justify-center gap-1.5' })}
          >
            {isLinkedIn
              ? <><Link2 size={13} strokeWidth={1.75} /> LinkedIn</>
              : <><ExternalLink size={13} strokeWidth={1.75} /> Visit</>}
          </a>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
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

  const base = cardClass({ className: 'flex flex-col transition-shadow' });

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={base} style={{ textDecoration: 'none' }}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}

export default function SmartCard({ resource }: { resource: Resource }) {
  return resource.type === 'person'
    ? <PersonCard resource={resource} />
    : <ResourceCard resource={resource} />;
}
