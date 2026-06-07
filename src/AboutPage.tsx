import { ArrowLeft, Plus, Library } from 'lucide-react';
import { buttonClass } from './keel';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--of-bg-base)', color: 'var(--of-fg-default)' }}>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--of-fg-subtle)' }}>
          <ArrowLeft size={13} strokeWidth={1.75} /> Back to the library
        </a>

        <h1
          className="mt-4 text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--of-font-display)', color: 'var(--of-fg-default)' }}
        >
          About this library
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-relaxed" style={{ color: 'var(--of-fg-muted)' }}>
          <p>
            <strong style={{ color: 'var(--of-fg-default)' }}>Design Resources</strong> is a
            living library — articles, books, talks, people, tools, podcasts, events, methods,
            and more — organized into a browsable category tree. The goal is simple: get you
            from "I'm trying to get better at X" to a useful starting point in a few clicks.
          </p>

          <p>
            Almost everything here was found, read, watched, or listened to — and added by hand.
            Nothing is scraped in bulk by an AI crawler. Every entry is a genuine recommendation:
            something that actually taught, helped, or shifted how someone thinks about design.
            That's slower than scraping the web, but it's the point — curation over volume.
          </p>

          <p>
            Design, and the tools we use to practice it, has moved fast over the last few
            years — especially with the rise of AI. Some resources here reflect an earlier
            moment: a tool that's since been replaced, a workflow that's evolved, an idea
            written before the current wave of change. They're kept anyway, because
            understanding where an idea came from is part of understanding where it's going —
            older pieces are worth reading as context and history, not just as how-tos.
          </p>

          <p>
            This library gets better with more people looking after it. If you know something
            that belongs here — or you spot a link that's gone stale, a recommendation that no
            longer holds up, or anything else worth a second look — say so. Every suggestion
            goes to a curator for review, and every bit of feedback helps keep this useful for
            the next person who finds it.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="/suggest" className={buttonClass({ variant: 'tint', size: 'sm' })}>
            <Plus size={14} strokeWidth={1.75} /> Suggest a resource
          </a>
          <a href="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            <Library size={14} strokeWidth={1.75} /> Browse the library
          </a>
        </div>
      </div>
    </div>
  );
}
