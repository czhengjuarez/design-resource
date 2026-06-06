# Design Resources — Project Plan

A living library of design resources, migrated from a Coda doc and rebuilt as a
single Cloudflare Worker. This document is the source of truth for scope and
phasing. Update it as phases land.

---

## 1. Vision

A curated, browsable library of design resources (articles, books, talks,
people, tools, events, threads, …) organized into a category tree. Three
audiences:

- **Public visitors** — browse, search, filter, and **suggest** new resources.
- **Admins** (the curator) — full CRUD over categories and resources, plus an
  approval queue for public suggestions. Gated by **Cloudflare Access**.
- **Everyone** — benefits from **AI-assisted findability** (semantic search,
  auto-tagging/categorization, related resources).

---

## 2. Architecture & stack

- **Runtime:** one Cloudflare Worker serving both the API and the static SPA.
- **Frontend:** React 19 + Vite, React Router, React Query.
- **API:** Hono.
- **Data:** D1 (SQLite) via Drizzle ORM.
- **AI:** Workers AI (embeddings + text generation) and Vectorize (vector index).
- **Auth:** Cloudflare Access in front of `/admin` and `/api/admin/*`.
- **Styling:** **Keel design system** (`@ops-forward/keel`) — see §8.
- **Deploy:** `wrangler deploy` to Cloudflare Workers (see §9).

```
worker/        Hono API + D1 (drizzle) + (later) AI/Vectorize bindings
src/           React SPA (public browse, admin, suggest)
db/            schema.ts, migrations/, seed/
scripts/       Coda import (one-time migration, done)
```

---

## 3. Data model (current — db/schema.ts)

- **categories** — self-referencing tree (`parentId`), up to 4 levels, 4 top
  sections. Fields: `name`, `slug`, `icon`, `description`, `sortOrder`.
- **resources** — `title`, `description`, `url`, `categoryId`, `type`
  (article|book|talk|video|tool|person|event|thread|note|method|podcast|newsletter),
  `author`, `tags` (json), `imageUrl`, `source` (coda|manual|suggestion),
  `status` (published|pending|rejected), `submitterName`/`submitterEmail`,
  `codaRowId` (idempotent re-import), timestamps.

The `status` + `submitter_*` columns already support the public-suggestion flow.
Planned additions in later phases:
- Vectorize keeps embeddings keyed by resource id (no schema change needed).
- Possibly an `audit` or `updatedBy` field once admin editing exists.

---

## 4. Feature area: Public browse  *(Phase 2 — partly done)*

**Done:**
- `GET /api/categories` — nested tree with per-node published counts.
- `GET /api/resources` — filter by category (incl. descendants), `type`, `q`
  search (title/description/author), pagination (`page`/`limit`).
- `GET /api/resources/:id`.
- UI: category sidebar (collapsible tree + rollup counts), type filter,
  debounced search, paginated **card** grid.

**Remaining for this area:**
- [ ] **List view + card view toggle** (explicit requirement). List view = dense
      rows (title, type, author, category, host); card view = current grid.
      Persist preference (localStorage).
- [ ] Mobile sidebar drawer (sidebar is currently `hidden` below `md`).
- [ ] Resource detail / "related resources" (depends on AI phase).
- [ ] Empty-URL items (people/notes, 33 rows) render as non-link cards (done in
      card view; mirror in list view).

---

## 5. Feature area: Admin (Cloudflare Access)  *(Phase 3)*

Curator-only. **Protected by Cloudflare Access** — the Worker validates the
`Cf-Access-Jwt-Assertion` header (verify against the team's public keys /
`aud`) on every `/api/admin/*` route, and the `/admin` SPA routes are behind the
same Access application.

**Capabilities:**
- [ ] **Resources CRUD:** create, edit, delete; bulk actions.
- [ ] **Move** a resource to a different category.
- [ ] **Categories CRUD:** create, rename, edit icon/description, delete
      (decide: reparent children & set resources' category to null, or block).
- [ ] **Reorder / re-nest** categories (drag-and-drop → `sortOrder` / `parentId`).
- [ ] **Suggestion queue** (overlaps §6): list `status='pending'`, approve
      (→ `published`) or reject (→ `rejected`), optionally edit before approving.

**API sketch:**
```
POST   /api/admin/resources
PATCH  /api/admin/resources/:id        # edit / move (categoryId) / status
DELETE /api/admin/resources/:id
POST   /api/admin/categories
PATCH  /api/admin/categories/:id        # rename, reparent, reorder
DELETE /api/admin/categories/:id
GET    /api/admin/suggestions           # status=pending
POST   /api/admin/suggestions/:id/approve
POST   /api/admin/suggestions/:id/reject
```

---

## 6. Feature area: Public suggestions  *(Phase 4)*

Let any visitor propose a resource into a chosen category; it lands as
`status='pending'` for admin approval.

- [ ] Public submit form: title, url, type, category (from the tree),
      description, optional submitter name/email.
- [ ] `POST /api/suggestions` → inserts `status='pending'`, `source='suggestion'`.
      Rate-limit / basic spam protection (e.g. Turnstile).
- [ ] Pending items never appear in public browse (already enforced: public
      queries filter `status='published'`).
- [ ] Approval handled in the admin suggestion queue (§5).
- [ ] (Optional) email the submitter on approve/reject via Cloudflare Email.

---

## 7. Feature area: AI findability (Cloudflare AI)  *(Phase 5)*

Use **Workers AI** + **Vectorize** to make 450+ resources easier to find.

- [ ] **Semantic search:** embed each resource (title + description + tags) into
      Vectorize; embed the query; return nearest neighbors. Blend with / replace
      the current LIKE search, or expose as a "smart search" mode.
- [ ] **Related resources:** on a detail view, show nearest neighbors.
- [ ] **AI-assisted intake:** when a resource/suggestion is added with just a
      URL, generate a title, summary, suggested `type`, suggested `category`,
      and tags (admin reviews before saving).
- [ ] **Natural-language filter:** "talks about design systems from 2023" →
      structured filters.
- [ ] Backfill embeddings for existing rows; keep them in sync on create/edit.

Bindings to add to `wrangler.jsonc`: `AI` (Workers AI) and `VECTORIZE` (index).
The Worker already reserves these in comments.

---

## 8. Styling: Keel design system

Adopt **Keel** (`@ops-forward/keel`) — https://github.com/czhengjuarez/Keel —
as the visual layer, replacing the ad-hoc Tailwind classes used in Phase 2.

What Keel provides (per its README):
- `import '@ops-forward/keel/styles.css'` — base styles + design tokens
  (CSS/JSON/TS artifacts).
- Class helpers: `buttonClass({ variant, size, disabled })`, `cardClass(...)`.
- Brand gradient `linear-gradient(180deg, #FB41AA 0%, #8F1F57 100%)`.
- **Lucide** icons, `stroke-width: 1.75`, `20px` default.

**Tasks:**
- [ ] Resolve install path: Keel is a GitHub monorepo package, not (yet) on
      public npm — decide between installing via git URL, publishing to a
      registry, or vendoring the built `styles.css` + helpers. **(open question)**
- [ ] Replace card/button/badge styling in `ResourceCard`, `CategorySidebar`,
      and `App` header with Keel helpers + tokens.
- [ ] Add Lucide for icons (type badges, sidebar chevrons, actions).
- [ ] Map current dark theme to Keel tokens; confirm whether Keel is
      light/dark/both.

---

## 9. Deployment (Cloudflare Workers)

- [ ] Create the **remote D1** database; replace `REPLACE_WITH_D1_DATABASE_ID`
      in `wrangler.jsonc`.
- [ ] Apply migrations remotely: `npm run db:migrate:remote`.
- [ ] Seed remotely: `wrangler d1 execute design-resources --remote --file=db/seed/coda-import.sql`.
- [ ] Add bindings as phases land: `AI`, `VECTORIZE`, `IMAGES` (R2, if image
      uploads are needed).
- [ ] Configure **Cloudflare Access** application over `/admin` + `/api/admin/*`.
- [ ] `npm run deploy` (build + `wrangler deploy`). Custom domain optional.

---

## 10. Roadmap (phases)

| Phase | Scope | Status |
|------|-------|--------|
| 0 | Scaffold (React+Vite+Hono+D1) | ✅ done |
| 1 | Coda importer + migrate 451 resources | ✅ done |
| 2 | Public browse API + UI (card grid, filters, search) | ✅ done (list-view toggle outstanding) |
| 2.1 | List/card view toggle + mobile sidebar | ⏳ next |
| 3 | Admin CRUD + Cloudflare Access | ⏳ |
| 4 | Public suggestions + approval queue | ⏳ |
| 5 | AI findability (Workers AI + Vectorize) | ⏳ |
| 6 | Keel design system adoption | ⏳ (can run alongside 2.1) |
| 7 | Remote deploy + Access config | ⏳ |

---

## 11. Open questions

1. **Keel distribution** — how do we consume `@ops-forward/keel` (git dep,
   private registry, or vendored build)? See §8.
2. **Keel theming** — light, dark, or both? Phase 2 UI is dark.
3. **Category deletion semantics** — reparent children + null out resource
   links, or block deletion when non-empty?
4. **Suggestion spam protection** — Turnstile or simpler?
5. **Search strategy** — does AI semantic search replace LIKE search, or sit
   beside it as a "smart" mode?
6. **Admin identity** — single curator, or multiple Access-authorized admins
   (do we need `updatedBy` auditing)?
