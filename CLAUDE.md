# CLAUDE.md

Guidance for Claude Code working in this repository.

---

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions. Consult Rahi's Mind Palace (`~/Desktop/mind-palace`) for brand/voice/design context.

---

## Project Overview

**Day Zero** — a goal/milestone **countdown tracker** (a Dropout Studio free/public tool, sibling to `order-processor` and `invoice-generator`). A user creates countdowns toward a target date for a goal, makes many, and sees them all at once on one board: the soonest upcoming goal is promoted to an oversized **hero**, the rest fill a responsive grid, and reached goals collapse into a quieter section. Any countdown can be shared via a read-only public link (`/s/[token]`). An AI copilot manages countdowns in natural language. **No ads.**

**Stack**: SvelteKit 2 + Svelte 5 runes · TypeScript strict · Tailwind v4 (CSS-first; tokens from `@dropout/ds`, vendored) + shadcn-svelte · Better Auth (Google OAuth only) · Cloudflare D1 + Drizzle · Cloudflare Workers AI (copilot, direct binding) · GSAP · Bun. Dark-only (`app.html` hardcodes `<html class="dark">`).

**Auth-gated**: any Google-authenticated user gets full access; unauthenticated users are redirected to `/login`. The public `/s/[token]` share route is the one exception — it has no auth guard by design. All data is scoped to `userId` in D1.

---

## Commands

```bash
bun run dev               # vite dev (--open --host); bindings via platformProxy + .dev.vars
bun run build             # production build (Cloudflare adapter)
bun run preview           # build + wrangler dev (full Workers preview)
bun run check             # svelte-check (strict TS) — must be 0 errors/0 warnings
bun run lint              # eslint
bun run format            # prettier --write
bun run sync-ds           # re-vendor @dropout/ds from ../../dropout-design-system (rsync --delete)
bun run db:generate       # generate Drizzle migration from schema
bun run db:migrate        # apply migrations to REMOTE D1 (production)
bun run db:migrate:local  # apply migrations to local D1 (dev/preview)
bun run cf-typegen        # regenerate worker-configuration.d.ts after wrangler.jsonc changes
```

---

## Architecture

### Path aliases

`$lib` → `src/lib/` (SvelteKit default) · `$src` → `src/` (custom; route files import `$src/components/*`). Never use relative paths from route files.

### Design system (`$lib/ds`)

The frontend runs on the **Dropout Design System**, **vendored** at `src/lib/ds/` — NOT an npm/`file:` dependency (a sibling-path dep breaks Cloudflare git-push auto-deploy). `app.css` imports `ds/styles/tokens.css` + `ds/styles/animations.css` (ink ramp, semantic aliases, type scale, fonts, `--ease`, base layer). DS exports `cn`, editorial components (`Cta`, `Heading`, `Eyebrow`, `Input`, `Tile`), and style-string consts (`inputBase`, `labelBase`, `tileBase`, …). DS law: monochrome black-led ink ramp, ONE `signal` accent, editorial/typographic, restraint hierarchy, ↗ glyph, dark canonical. **Never hand-edit `src/lib/ds/`** — edit upstream then `bun run sync-ds`.

### Domain

- `src/lib/types.ts` — `Countdown` ({ id, title, `targetAt` (ISO UTC string), hasTime, note, archived, shareToken, position, createdAt }), `CountdownInput`, `CountdownPatch`, `PublicCountdown`. **No per-countdown color** (DS allows one accent) — differentiation is typographic.
- `src/lib/server/schema.ts` — Drizzle: Better Auth tables + `countdowns` + AI tables (`ai_conversations`, `ai_messages`, `ai_actions`). Snake_case columns (Better Auth adapter invariant). `share_token` is unique & nullable.
- `src/lib/server/repositories/countdowns.ts` — `listByUser`, `create`, `update`, `remove`, `reorder`, `setShare`, and the one cross-user read `getByShareToken` (returns only the safe public projection — never owner/ids).
- `src/lib/server/{api,db,auth,dto,validation}.ts` — `requireApiContext`/`parseJson`/`ok`, Drizzle factory, Better Auth factory, row→domain mappers, Zod request schemas.
- REST: `src/routes/api/countdowns/{+server (GET/POST/PUT-reorder), [id]/+server (PATCH/DELETE), [id]/share/+server (POST/DELETE)}`.

### Stores (factory-closure runes singletons)

- `src/lib/stores/clock.svelte.ts` — **single shared 1Hz ticker** (`clock.now`). Every card derives remaining time from it; never one interval per card.
- `src/lib/stores/countdowns.svelte.ts` — board state synced to D1. Text edits (title/note) debounced; structural changes immediate. Derived partitions `upcoming`/`past`/`hero` read `clock.now` so the board re-partitions the instant a countdown crosses zero. `aiInject`/`aiRemove` are local-only mutators the copilot uses to reflect its API writes.
- `src/lib/stores/ai.svelte.ts` — copilot state (conversations, messages, confirm queue, undo).

### UI

- `src/routes/+page.svelte` — the board. Single `untrack()` hydration site (`countdowns.hydrate` + `ai.hydrate`). Hero + grid + past sections; `use:reveal` entrance motion.
- `src/components/` — `CountdownDisplay` (the shared digits unit; hero/card/share sizes; reads the clock), `CountdownHero`, `CountdownCard`, `CountdownComposerDialog` (create/edit; native date/time → absolute UTC ISO), `ShareDialog`, `EmptyState`, `User`, `ai/*` (copilot UI).
- `src/lib/countdown/format.ts` — pure, SSR-safe time math (`remaining`, `humanize`, `formatTargetDate`). Granularity rule: ≥1 day → D/H/M (+ seconds only for timed goals within 30 days); <1 day → H/M/S. `now` is passed in (never read inside) so server/first-client renders match.

### Share (public)

`src/routes/s/[token]/` — unauthenticated. No auth guard lives here (the wall is only `/`'s `/login` redirect). Loads via `getByShareToken`; 404 if the token isn't shared. Reuses `CountdownDisplay`. Dynamic OG/Twitter meta.

### AI Copilot

Gated by `AI_COPILOT_ENABLED` (set `"false"` to disable). Calls the **Workers AI binding directly** (`platform.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages, tools })`) in `src/lib/ai/client.ts` — **no AI Gateway dynamic route, no RAG/Vectorize**. Five tools (`createCountdown`/`updateCountdown`/`reorderCountdowns` = Tier A auto-apply; `deleteCountdown`/`setShareCountdown` = Tier B, require confirmation), each with a Zod schema (`schemas.ts`), a client executor wired to the countdowns store (`tools.ts`), and an inverse for undo (`inverse.ts` / server `ai-undo.ts`). The model receives the user's current countdowns + today's date each turn (`context.ts`, `prompts.ts`). Chat route (`api/ai/chat`) keeps the load-bearing imperative-retry + false-claim suppression + text-JSON tool-call salvage. Conversations/messages/actions persist in D1; quota/spend caps degrade gracefully when `AI_QUOTA_KV` is absent. **Workers AI can't be exercised in local dev** (no remote AI) — verify after deploy.

---

## Conventions & Warnings

- **Svelte 5 runes only** — `$state`/`$derived`/`$props`/`$effect`; never `export let` or `$:`. Arrow functions, double quotes, tabs, no trailing commas (Prettier).
- **`untrack()` hydration** — `+page.svelte` seeds stores once inside `untrack()`. Do not add a second hydrate path.
- **Snake_case D1 columns** — required by the Better Auth Drizzle adapter; renaming breaks auth.
- **Two `cn()`** — use `$lib/ds` `cn()` inside DS-token markup (handles custom `text-*` sizes); `$lib/utils` `cn()` everywhere else. Countdown digits use plain Tailwind `text-*` sizes + `tabular-nums`.
- **GSAP only via `$lib/motion`** — never a top-level `import ... from "gsap"` (SSR-unsafe on Workers). All motion respects `prefers-reduced-motion`.
- **Never nest `<button>` in `<button>`** — SSR auto-closes and desyncs hydration (whole-app double-render). Use `div[role="button"]` + tabindex/keydown, inner actions `stopPropagation`.
- **Vendored DS is read-only** — edit upstream + `sync-ds`.
- **Commits**: Conventional Commits, atomic, **no AI co-author**. `bun run check` + `bun run lint` must pass before every commit.

---

## Cloudflare bindings & deploy

`wrangler.jsonc`: `DB` (D1 `day_zero`, required), `AI` (Workers AI, `remote: true`, copilot), `AI_QUOTA_KV` (optional quota/spend). `account_id` = Personal. Vars: `BETTER_AUTH_URL`, `AI_COPILOT_ENABLED`, `AI_MONTHLY_CAP_USD`.

**Secrets** (`wrangler secret put`): `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**To deploy (production):**

1. Create/choose a Google OAuth client; add redirect URI `https://day-zero.beyourahi.workers.dev/api/auth/callback/google`.
2. `wrangler secret put BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
3. `bun run db:migrate` (remote D1).
4. `wrangler deploy` (or git-push auto-deploy).
5. Confirm the `AI` binding is provisioned in prod; then flip the Day Zero showcase cards on dropoutstudio.co / beyourahi.com from `coming-soon` to `active`.

---

For Cloudflare work, prefer the installed Cloudflare skills and Code Mode MCP over your own knowledge.
