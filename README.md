# Design Resources

A living library of design resources — articles, books, talks, people, tools,
podcasts, events, methods, and more — organized into a browsable category tree
so you can go from "I'm trying to get better at X" to a useful starting point
in a few clicks.

It started as a personal collection in a Coda doc and has been rebuilt as a
single Cloudflare Worker (React + Vite frontend, Hono API, D1 database, and
Workers AI for semantic search). See [PLAN.md](PLAN.md) for the full
architecture and roadmap.

## What this is

Almost everything in this library was found, read, watched, or listened to —
and added by hand. Nothing here is scraped in bulk by an AI crawler. Every
entry is a genuine recommendation: something that actually taught, helped, or
shifted how someone thinks about design. That's slower than scraping the web,
but it's the point — curation over volume.

## A note on freshness

Design, and the tools we use to practice it, has moved fast over the last few
years — especially with the rise of AI. Some resources here reflect an earlier
moment: a tool that's since been replaced, a workflow that's evolved, an idea
written before the current wave of change. They're kept anyway, because
understanding where an idea came from is part of understanding where it's
going. Older pieces are worth reading as context and history, not just as
how-tos.

## Contributing & helping maintain it

This library gets better with more people looking after it:

- **Found something that belongs here?** Use the in-app "Suggest a resource"
  form (`/suggest`). Every suggestion goes to a curator for review before it's
  published.
- **Spot something stale?** A dead link, an outdated recommendation, anything
  that no longer holds up — flag it the same way. Keeping the library accurate
  is just as valuable as growing it.

## Development

```bash
npm install
npm run dev          # Vite dev server (Cloudflare Workers simulator)
npm run typecheck    # type-check app, worker, and node configs
npm run deploy       # build and deploy to Cloudflare Workers
```

Database migrations:

```bash
npm run db:generate         # generate a migration from db/schema.ts changes
npm run db:migrate:local    # apply migrations to the local D1 simulator
npm run db:migrate:remote   # apply migrations to the production D1 database
```

See [PLAN.md](PLAN.md) for the data model, API surface, and phased roadmap.
