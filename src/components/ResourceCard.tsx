import type { Resource } from "../types";

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  book: "Book",
  talk: "Talk",
  video: "Video",
  tool: "Tool",
  person: "Person",
  event: "Event",
  thread: "Thread",
  note: "Note",
  method: "Method",
  podcast: "Podcast",
  newsletter: "Newsletter",
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const { url, title, description, author, type, tags } = resource;
  const host = url ? hostname(url) : null;

  const inner = (
    <>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-300">
          {TYPE_LABELS[type] ?? type}
        </span>
        {host && <span className="truncate text-neutral-500">{host}</span>}
      </div>
      <h3 className="mt-2 font-medium leading-snug text-neutral-100 group-hover:text-emerald-300">
        {title}
      </h3>
      {author && <p className="mt-1 text-sm text-neutral-400">{author}</p>}
      {description && (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-400">
          {description}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded bg-neutral-800/70 px-1.5 py-0.5 text-xs text-neutral-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const className =
    "group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/70";

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}
