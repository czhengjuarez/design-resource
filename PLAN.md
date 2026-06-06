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
- [ ] **Categories CRUD:** create, rename, edit icon/description, delete.
      **Delete = reparent:** on deletion, the node's children are reparented to
      the deleted node's `parentId` (→ top-level if it was a section), and
      resources pointing at it move to that same `parentId` (null if it was a
      section). No orphans, no data loss.
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

**Search strategy (decided): hybrid.** Keep the fast keyword (LIKE) search as
the default — instant, free, exact for known terms. Add semantic search as an
opt-in **"Smart search"** toggle (embeds the query once, queries Vectorize for
nearest neighbors). This avoids an embedding call on every keystroke and keeps
the simple path simple. The same nearest-neighbor query powers "related
resources".

- [ ] **Semantic search:** embed each resource (title + description + tags) into
      Vectorize; on "Smart search", embed the query and return nearest
      neighbors. Default search stays keyword/LIKE.
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
as the visual layer, replacing the ad-hoc Tailwind classes from Phase 2.

What Keel actually ships (from `packages/keel`):
- **React components:** `Button`, `Badge`, `Card`, `InputField`, `SelectField`,
  `TextareaField`, `Switch` (peer dep `react >=18`).
- **CSS:** `src/styles.css` with `of-*` component classes
  (`.of-btn`, `.of-btn--primary|secondary|ghost|tint|danger`, `--sm/md/lg`, …).
- **Tokens:** `tokens/tokens.css` + `colors_and_type.css` — a semantic token
  system driven by **`light-dark()`** with `color-scheme: light dark`.
  Primitives `--of-magenta-*`, `--of-gray-*`, status colors; semantic surfaces
  `--of-bg-base/elevated/recessed`, `--of-fg-*`, `--of-border-line`,
  `--of-bg-brand`, `--of-ring`, radii/durations/fonts (Space Grotesk, Inter,
  JetBrains Mono).
- **Lucide** icons, `stroke-width: 1.75`, `20px` default.

**Theming (resolves Q2): support both light and dark.** Keel's `light-dark()`
tokens adapt automatically from `color-scheme`. We expose a theme toggle
(light / dark / system) that sets `color-scheme` on `:root`; no per-component
work needed. (Phase 2's hardcoded dark Tailwind classes get removed.)

**Distribution (resolves Q1): vendor it.** `@ops-forward/keel` lives in a
`packages/keel` workspace inside a *private* monorepo, so `npm i github:…`
would resolve the private root package (`keel-system`), not the sub-package —
git-install won't work cleanly, and it's not on public npm. Plan:
- [ ] Vendor Keel into `src/keel/` — copy `tokens/tokens.css` +
      `colors_and_type.css` + `packages/keel/src/styles.css` + the component
      `.tsx` files (+ `utils.ts`, `types.ts`). Record the source commit hash in
      a header comment so updates are traceable.
- [ ] Import the token + component CSS in `src/index.css` (replacing the raw
      Tailwind import, or keeping Tailwind only for layout utilities — TBD).
- [ ] (Future, optional) if Keel gets published to GitHub Packages, switch from
      vendored copy to the registry dependency.

**Migration tasks:**
- [ ] Restyle `ResourceCard` with Keel `Card` + `Badge`, header buttons/inputs
      with `Button`/`InputField`/`SelectField`, sidebar with token colors.
- [ ] Add Lucide for icons (type badges, sidebar chevrons, admin actions).

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

## 11. Decisions & open questions

**Resolved:**
1. ✅ **Keel distribution** — vendor it into `src/keel/` (private monorepo
   sub-package, not installable via npm/git). See §8.
2. ✅ **Keel theming** — support **both** light and dark via Keel's `light-dark()`
   tokens + a theme toggle. See §8.
3. ✅ **Category deletion** — **reparent** children and resources to the deleted
   node's parent. See §5.
4. ✅ **Search strategy** — **hybrid**: keyword/LIKE by default, opt-in "Smart
   search" semantic mode + related-resources. See §7.

**Still open:**
5. **Suggestion spam protection** — Turnstile or simpler? (Phase 4)
6. **Admin identity** — single curator, or multiple Access-authorized admins
   (do we need `updatedBy` auditing)? (Phase 3)
