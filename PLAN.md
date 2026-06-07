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
  approval queue for public suggestions. Gated by a **built-in password login**
  (see §5 for why this replaced the originally-planned Cloudflare Access).
- **Everyone** — benefits from **AI-assisted findability** (semantic search,
  auto-tagging/categorization, related resources).

---

## 2. Architecture & stack

- **Runtime:** one Cloudflare Worker serving both the API and the static SPA.
- **Frontend:** React 19 + Vite, React Router, React Query.
- **API:** Hono.
- **Data:** D1 (SQLite) via Drizzle ORM.
- **AI:** Workers AI (embeddings + text generation) and Vectorize (vector index).
- **Auth:** built-in password session auth (`worker/auth.ts`) in front of
  `/admin` and `/api/admin/*` — see §5 for why this replaced Cloudflare Access.
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

## 5. Feature area: Admin (password-gated)  *(Phase 3)*

Curator-only. **Protected by built-in password auth** (not Cloudflare Access
— see decision below): `worker/auth.ts` issues a signed, httpOnly session
cookie after a correct `ADMIN_PASSWORD`; `adminAuth` middleware gates every
`/api/admin/*` route, and `AdminLayout` redirects unauthenticated visitors
to `/admin/login` client-side. ✅ shipped.

> **Why not Cloudflare Access?** Access path-scoped applications (gate just
> `/admin`, leave the public site open) require the hostname to belong to a
> zone (custom domain) in your account. The shared `*.workers.dev` domain only
> supports gating an *entire* worker — which would force login on every public
> visitor too. Rather than buy/connect a domain just for this, we built a
> small password-gate directly into the Worker: `wrangler secret put
> ADMIN_PASSWORD` in production, `.dev.vars` locally. If a custom domain is
> added later, swapping back to Access is a clean drop-in (the middleware
> shape is the same).

**Capabilities — all shipped:**
- [x] **Resources CRUD:** create, edit, delete (table + modal forms in AdminResources).
- [x] **Move** a resource to a different category (category picker in the edit form).
- [x] **Categories CRUD:** create, rename, edit icon/description, delete.
      **Delete = reparent** (implemented exactly as designed): children and
      resources move to the deleted node's `parentId`. No orphans, no data loss.
- [x] **Suggestion queue:** AdminSuggestions lists `status='pending'`, with
      one-click approve/reject or "Review & edit" before publishing.
- [ ] **Reorder / re-nest** categories via drag-and-drop (currently: edit the
      parent dropdown manually — functional but not as ergonomic).
- [ ] Bulk actions on resources (multi-select delete/move/retag).

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

## 6. Feature area: Public suggestions  *(Phase 4 — ✅ done)*

Let any visitor propose a resource into a chosen category; it lands as
`status='pending'` for admin approval.

- [x] Public submit form at `/suggest` (`SuggestPage.tsx`): title, url, type,
      category (flattened tree dropdown), description, optional submitter
      name/email. Linked from the public header and mobile drawer.
- [x] `POST /api/suggestions` → inserts `status='pending'`, `source='suggestion'`.
      **Spam protection (resolves Q5 — chose "simpler" over Turnstile):**
      no external service/dashboard setup needed —
        - honeypot field, visually hidden off-screen (not `display:none`,
          which basic bots skip)
        - `renderedAt` timing check: rejects submissions faster than a human
          could plausibly fill the form (<3s)
      Both failure modes return a generic `201 {ok:true}` so automated
      submitters can't learn to adapt and probe for the real validation.
- [x] Pending items never appear in public browse (enforced: public queries
      filter `status='published'`) — verified end to end.
- [x] Approval handled in the admin suggestion queue (§5, shipped Phase 3).
- [ ] (Optional, not done) email the submitter on approve/reject via
      Cloudflare Email.

**Verified end-to-end:** spam (honeypot/too-fast) silently dropped → nothing
written; legit submission lands in admin's pending queue; pending items stay
fully invisible in public browse (`0` results when searched publicly).

---

## 7. Feature area: AI findability (Cloudflare AI)  *(Phase 5 — ✅ core shipped)*

Use **Workers AI** + **Vectorize** to make 450+ resources easier to find.

**Search strategy (decided): hybrid.** Keep the fast keyword (LIKE) search as
the default — instant, free, exact for known terms. Add semantic search as an
opt-in **"Smart search"** toggle (embeds the query once, queries Vectorize for
nearest neighbors). This avoids an embedding call on every keystroke and keeps
the simple path simple. The same nearest-neighbor query powers "related
resources".

**Shipped:**
- [x] **Semantic search:** `worker/embeddings.ts` embeds title+description+
      author+type+tags via `@cf/baai/bge-base-en-v1.5` (768-dim) into
      Vectorize index `design-resources-embeddings` (cosine metric). Public
      `GET /api/search/smart?q=…` embeds the query and ranks by similarity;
      keyword/LIKE stays the default in `GET /api/resources`.
- [x] **"Smart" toggle** in the public header (Sparkles icon, persisted to
      localStorage): swaps to embedding-ranked results, 700ms debounce
      (each query costs an AI call), explanatory banner, category/type
      filters disabled in this mode (it ranks across everything by meaning).
- [x] **Related resources:** `GET /api/resources/:id/related` — nearest
      neighbors by embedding similarity. Surfaced as an inline "Related"
      expansion on resource cards (no detail-view page needed — adapted the
      original plan to the card-grid UI that exists).
- [x] **Backfill + sync:** chunked admin endpoint
      `POST /api/admin/embeddings/backfill` (40/call, paginated) — ran to
      completion across all 452 resources. New writes stay in sync
      automatically: create/edit/delete/suggestion-approve all call
      `upsertResourceEmbedding`/`deleteResourceEmbedding` via `waitUntil`
      (non-published resources are excluded from the index).

**Verified (genuine semantic ranking, not keyword overlap):** the query
*"helping someone feel confident in a new leadership role"* matches **0**
keyword-search results but returns 5 relevant Smart Search results (self-
leadership articles, "Authentic Leadership", etc.); "DesignOps 101" surfaces
"DesignOps Blog/Handbook/State-of-DesignOps" as related resources.

**Not done (lower priority, future work):**
- [ ] **AI-assisted intake** — generate title/summary/type/category/tags from
      just a URL when adding a resource or reviewing a suggestion.
- [ ] **Natural-language filter** — "talks about design systems from 2023" →
      structured filters (would need date extraction; most resources lack
      publish dates in the current data).

Bindings live in `wrangler.jsonc`: `ai: { binding: "AI" }` and
`vectorize: [{ binding: "VECTORIZE", index_name: "design-resources-embeddings",
remote: true }]` — `remote: true` is required because Vectorize has no local
dev simulator.

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

**Live at https://design-resources.coscient.workers.dev** (deployed 2026-06-07).

Done:
- [x] Created remote D1 (`06d57493-5b56-4277-a712-5d8811c8b971`), wired into
      `wrangler.jsonc`, applied schema migration + all seed data (categories,
      451 Coda resources, people merge/tags, Changying, cleanup). Remote and
      local now match: 41 categories, 452 resources.
- [x] `npm run deploy` — live and serving.

**⚠ Incident (resolved):** the first deploy shipped `ADMIN_BYPASS_LOCAL=true`
to production because it lived in `wrangler.jsonc` `vars` (which get bundled
into every deploy), leaving `/api/admin/*` open with no auth for a few minutes.
Fixed by moving it to `.dev.vars` (gitignored, local-only — Wrangler loads it
for `dev` but never deploys it). Redeployed immediately; confirmed `/api/admin/*`
now returns `401` in production. **Lesson: anything in `wrangler.jsonc vars`
ships to prod — bypass/dev-only flags belong in `.dev.vars` or secrets.**

Still open:
- [ ] **Set the production admin password**: `wrangler secret put ADMIN_PASSWORD`
      (run by the user directly — secrets must never pass through chat/agent
      context). Until set, `/admin` login always fails closed (no bypass).
- [ ] Add bindings as later phases land: `AI`, `VECTORIZE`, `IMAGES`.
- [ ] Custom domain (optional — would also unlock swapping to Cloudflare
      Access with path-scoped rules, see §5).

Seed files now include portable, slug/title-keyed variants
(`db/seed/remote-people-merge-and-tags.sql`, `cleanup-people-category.sql`)
because **local and remote D1 assign different autoincrement ids** from the
same seed — hardcoded-id migrations only work on the instance they were
written against. Prefer slug/title lookups in future data migrations.

---

## 10. Roadmap (phases)

| Phase | Scope | Status |
|------|-------|--------|
| 0 | Scaffold (React+Vite+Hono+D1) | ✅ done |
| 1 | Coda importer + migrate 451 resources | ✅ done |
| 2 | Public browse API + UI (card grid, filters, search) | ✅ done |
| 2.1 | List/card view toggle, theme toggle, mobile sidebar | ✅ done |
| 3 | Admin CRUD + auth (resources/categories/suggestions, password gate) | ✅ done — set ADMIN_PASSWORD secret in prod |
| 4 | Public suggestions + approval queue | ✅ done — submit form (/suggest) + honeypot/timing spam checks, full pipeline verified |
| 5 | AI findability (Workers AI + Vectorize) | ✅ core done — Smart Search + related resources live; AI-assisted intake & NL filters deferred |
| 6 | Keel design system adoption | ✅ vendored + applied to public UI (admin pages still use raw Keel classes inline — fine, but could extract shared components) |
| 7 | Remote deploy | ✅ live at design-resources.coscient.workers.dev |

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

**Resolved (Phase 3 build):**
6. ✅ **Admin auth model** — single shared password (not Cloudflare Access — see
   §5 for why), since the project has one curator and no custom domain. No
   per-admin identity, so no `updatedBy` auditing for now. If multiple admins
   are ever needed, swap the password gate for per-user accounts (or get a
   domain and use Access with email-based policies + audit logs for free).

**Resolved (Phase 4 build):**
5. ✅ **Suggestion spam protection** — chose **simpler over Turnstile**: a
   honeypot field + submission-timing check, both built into the Worker with
   zero external services or dashboard config. See §6 for details and the
   verified results. Revisit only if real spam shows up in the queue —
   Turnstile remains the natural upgrade path if so.

**No open questions remain** — all six original items are resolved. Update
this section as new questions arise in later phases.
