# CLAUDE.md

Guidance for Claude Code working in this repository.

---

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions. Consult Rahi's Mind Palace (`~/Desktop/mind-palace`) for brand/voice/design context.

---

## Project Overview

**Day Zero** — a goal/milestone **countdown tracker** (a Dropout Studio free/public tool, sibling to `order-processor` and `invoice-generator`). A user creates countdowns toward a target date for a goal, makes many, and sees them all at once on one board: the soonest upcoming goal is promoted to an oversized **hero**, the rest fill a responsive grid, and reached goals collapse into a quieter section. Any countdown can be shared via a read-only public link (`/s/[token]`). An AI copilot manages countdowns in natural language. **No ads.**

**Stack**: SvelteKit 2 + Svelte 5 runes · TypeScript strict · Tailwind v4 (CSS-first; tokens from `@dropout/ds`, vendored) + shadcn-svelte · Better Auth (Google OAuth + Google One Tap + passkey/WebAuthn biometrics; email/password disabled) · Cloudflare D1 + Drizzle · Cloudflare Workers AI (copilot, **BYO** per-user via REST) · GSAP · Bun. Dark-only (`app.html` hardcodes `<html class="dark">`).

**Auth is optional, not a wall**: logged-out visitors get the **full board**, persisted to `localStorage` (`day-zero:guest:v1`); signing in unlocks server storage, cross-device sync, shareable links, and the AI Copilot. The board (`/`) no longer redirects — only `/settings` redirects to `/login` when signed out. No global guard (none in `hooks.server.ts`/`+layout.server.ts`); routes are public by default, but `/api/*` mutations and `/api/ai/*` stay 401-gated. Authed data is scoped to `userId` in D1; guest data lives only in the browser and is migrated into the account on first sign-in (`countdowns.migrateGuestToServer`).

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

**HARD RULE — the Dropout DS guidelines are binding.** Every UI/design change in this repo MUST obey **`~/Desktop/projects/dropout-design-system/GUIDELINES.md`** — the law for all UI: tokens, typography, layout shells, the shadcn-svelte primitive layer (pinned `components.json` preset + blessed kit), overlay/glass tokens, motion, a11y. Non-negotiable: theme via tokens, **never recolor a component**, components before custom markup. This applies automatically to every UI task whether or not the request mentions it. This project vendors `@dropout/ds` at `src/lib/ds/`.

The frontend runs on the **Dropout Design System**, **vendored** at `src/lib/ds/` — NOT an npm/`file:` dependency (a sibling-path dep breaks Cloudflare git-push auto-deploy). `app.css` imports `tailwindcss`, `ds/styles/tokens.css` + `ds/styles/animations.css` (ink ramp, semantic aliases, type scale, fonts, `--ease`, base layer), `tw-animate-css`, and `lib/styles/chat-animations.css` (copilot motion). DS exports `cn`, editorial components (`Cta`, `Heading`, `Eyebrow`, `Input`, `Tile`), and style-string consts (`inputBase`, `labelBase`, `tileBase`, …). DS law: monochrome black-led ink ramp, ONE `signal` accent, editorial/typographic, restraint hierarchy, ↗ glyph, dark canonical. **Never hand-edit `src/lib/ds/`** — edit upstream then `bun run sync-ds`.

### Domain

- `src/lib/types.ts` — `Countdown` ({ id, title, `targetAt` (ISO UTC string), hasTime, archived, shareToken, position, createdAt }), `CountdownInput`, `CountdownPatch`, `PublicCountdown`, `AppConfig`. **No per-countdown color** and **no `note`** (both dropped) — differentiation is typographic.
- `src/lib/server/schema.ts` — Drizzle: Better Auth tables (`users`, `sessions`, `accounts`, `verifications`, `passkeys` (WebAuthn creds), `rate_limits` (DB-backed rate limiting)) + `countdowns` + `user_settings` (per-user BYO-Cloudflare creds; AES-GCM-encrypted token blob) + AI tables (`ai_conversations`, `ai_messages`, `ai_actions`). Snake_case columns (Better Auth adapter invariant). `share_token` is unique & nullable.
- `src/lib/server/repositories/countdowns.ts` — `listByUser`, `create`, `update`, `remove`, `reorder`, `setShare`, and the one cross-user read `getByShareToken` (returns only the safe public projection — never owner/ids). `repositories/state.ts` exposes `loadAppState` (the `+page.server.ts`/chat board projection).
- `src/lib/server/{api,db,auth,dto,validation}.ts` — `requireApiContext`/`parseJson`/`ok`, Drizzle factory, Better Auth factory (Google OAuth + `oneTap()` + `passkey()` plugins; DB rate-limiting via `rate_limits`; 5-min signed session cookie cache; passkey `rpID`/`origin` derived from `BETTER_AUTH_URL` so dev/preview/prod all work), row→domain mappers, Zod request schemas. `src/lib/auth-client.ts` is the browser client (`passkeyClient` + `oneTapClient`, reads `PUBLIC_GOOGLE_CLIENT_ID`). `server/crypto.ts` (WebCrypto AES-GCM for the token at rest) + `server/ai/{cloudflare-config,run-rest,errors}.ts` back the BYO Copilot.
- REST: `src/routes/api/countdowns/{+server (GET/POST/PUT-reorder), [id]/+server (PATCH/DELETE), [id]/share/+server (POST/DELETE)}`.

### Stores (factory-closure runes singletons)

- `src/lib/stores/clock.svelte.ts` — **single shared 1Hz ticker** (`clock.now`). Every card derives remaining time from it; never one interval per card.
- `src/lib/stores/countdowns.svelte.ts` — board state. An `authed` flag (set at hydrate) routes writes: authed → D1 (title edits debounced, structural changes immediate); guest → `localStorage` synchronously (creates mint their own id/position client-side). `loadGuest`/`migrateGuestToServer` bridge the two. Derived partitions `upcoming`/`past`/`hero` read `clock.now` so the board re-partitions the instant a countdown crosses zero. `aiInject`/`aiRemove` are local-only mutators the copilot uses to reflect its API writes.
- `src/lib/stores/ai.svelte.ts` — copilot state (conversations, messages, confirm queue, undo).

### UI

- `src/routes/+page.svelte` — the board. Server data is seeded ONCE inside `untrack()` (`countdowns.hydrate` + `ai.hydrate`); a separate `onMount` bridge then runs the browser-only guest path (authed → `migrateGuestToServer`, guest → `loadGuest`). Hero + grid + past sections; `use:reveal` entrance motion. Guests see `SignInButton`; the share control is hidden when logged out (`canShare`).
- `src/components/` (app components, imported via `$src/components/*`) — `CountdownDisplay` (the shared boxed-tile digits unit with tick animation; hero/card/share sizes; reads the clock), `CountdownHero`, `CountdownCard`, `CountdownCalendar` (local DS-styled date picker built on the bits-ui Calendar primitive — replaces the unthemeable native `<input type="date">`; bindable `@internationalized/date` `DateValue`), `CountdownComposerDialog` (create/edit; uses `CountdownCalendar` + Switch-gated 12h AM/PM time → absolute UTC ISO), `ShareDialog`, `SectionEyebrow`, `EmptyState`, `Navbar` (invisible, in-flow top nav holding the `SignInButton`/`User` auth controls; shifts left when the copilot rail opens), `SignInButton`, `User`, `ai/*` (copilot UI — overlay drawer: `AiDesktopLauncher`/`AiSidebar` on lg+, `AiMobileFab`/`AiMobileSheet` on mobile). shadcn-svelte primitives live separately in `$lib/components/ui/*` (auto-generated — don't hand-edit).
- `src/routes/login/+page.svelte` — three sign-in paths: "Continue with Google" (social OAuth), auto-prompted Google One Tap (only when `PUBLIC_GOOGLE_CLIENT_ID` is set + in browser), and "Sign in with Face ID / Touch ID" (WebAuthn platform biometrics; hidden where the browser lacks WebAuthn). Passkeys are _registered_ in `/settings`, not here.
- `src/routes/changelog/+page.svelte` — public, static changelog page; entries sourced from `src/lib/data/changelog.ts`. `src/routes/settings/+page.svelte` — BYO-Cloudflare connect form (account id + API token + model picker) **+ Face ID / Touch ID management** (list / add / remove; platform-biometric only — `authenticatorAttachment: "platform"`, no roaming security keys).
- `src/lib/countdown/format.ts` — pure, SSR-safe time math (`remaining`, `humanize`, `formatTargetDate`). Granularity rule: **live seconds ALWAYS tick** (hero, cards, share, zen alike); the Days segment leads only once ≥1 full day remains, else H/M/S. `hasTime` no longer affects segments. `now` is passed in (never read inside) so server/first-client renders match.

### Share (public)

`src/routes/s/[token]/` — public/unauthenticated (no guard; the board no longer walls anything). Loads via `getByShareToken`; 404 if the token isn't shared. Reuses `CountdownDisplay`; supports full-screen zen mode. Dynamic OG/Twitter meta.

### AI Copilot (BYO Cloudflare)

Gated by `AI_COPILOT_ENABLED` (set `"false"` to disable) **and signed-in only**. Inference runs on the **end user's OWN Cloudflare account over the Workers AI REST API** (`POST /accounts/{id}/ai/run/{model}`, billed to them) — **NOT** the bound `env.AI` (retained for typing/compat only); **no AI Gateway, no RAG/Vectorize**. The user connects their account at `/settings` (account id + account-scoped API token + model from `/api/cf/models`); the token is AES-GCM-encrypted at rest in `user_settings` (`crypto.ts`, key from `TOKEN_ENCRYPTION_KEY`). `src/lib/server/ai/run-rest.ts` does the REST call + model catalog; `src/lib/ai/client.ts` buffers one turn into frames. The chat route resolves creds via `server/ai/cloudflare-config.ts` and returns **412 `cloudflare_not_connected`** (pointing to `/settings`) when unconnected. Five tools (`createCountdown`/`updateCountdown`/`reorderCountdowns` = Tier A auto-apply; `deleteCountdown`/`setShareCountdown` = Tier B, require confirmation), each with a Zod schema (`schemas.ts`), a client executor wired to the countdowns store (`tools.ts`), and an inverse for undo (`inverse.ts` / server `ai-undo.ts`). The model receives the user's current countdowns + today's date each turn (`context.ts`, `prompts.ts`). Chat route (`api/ai/chat`) keeps the load-bearing imperative-retry + false-claim suppression + text-JSON tool-call salvage. Conversations/messages/actions persist in D1; quota/spend caps degrade gracefully when `AI_QUOTA_KV` is absent. **The Copilot can't be exercised in local dev** (needs a real connected account + remote Workers AI) — verify after deploy.

---

## Conventions & Warnings

- **Svelte 5 runes only** — `$state`/`$derived`/`$props`/`$effect`; never `export let` or `$:`. Arrow functions, double quotes, tabs, no trailing commas (Prettier).
- **`untrack()` hydration** — `+page.svelte` seeds SERVER data once inside `untrack()`. Do not add a second server-hydrate path; the guest `localStorage` re-seed is the separate `onMount` bridge (browser-only, additive).
- **Snake_case D1 columns** — required by the Better Auth Drizzle adapter; renaming breaks auth.
- **Two `cn()`** — use `$lib/ds` `cn()` inside DS-token markup (handles custom `text-*` sizes); `$lib/utils` `cn()` everywhere else. Countdown digits use plain Tailwind `text-*` sizes + `tabular-nums`.
- **GSAP only via `$lib/motion`** — never a top-level `import ... from "gsap"` (SSR-unsafe on Workers). All motion respects `prefers-reduced-motion`.
- **Never nest `<button>` in `<button>`** — SSR auto-closes and desyncs hydration (whole-app double-render). Use `div[role="button"]` + tabindex/keydown, inner actions `stopPropagation`.
- **Vendored DS is read-only** — edit upstream + `sync-ds`.
- **`E2E_BYPASS_AUTH`** — `=true` in `.dev.vars` (gitignored; never `wrangler.jsonc`/prod) skips Google OAuth by synthesizing a session, upserting an `e2e-test-user` row on **every** request. So an **unmigrated local D1 → 500 on every route**; run `bun run db:migrate:local` first.
- **Commits**: Conventional Commits, atomic, **no AI co-author**. `bun run check` + `bun run lint` must pass before every commit.

---

## Cloudflare bindings & deploy

`wrangler.jsonc`: `DB` (D1 `day_zero`, required — absent at runtime, `/api/*` returns 503), `AI` (Workers AI, `remote: true` — typing/compat only; inference is BYO REST), `AI_QUOTA_KV` (optional quota/spend + `cf-models` cache). `compatibility_flags: ["nodejs_compat"]` is **required** — Better Auth and the AI layer use Node built-ins; removing it breaks auth at runtime. `account_id` = Personal. Served ONLY on the custom domain `day-zero.dropoutstudio.co` (`workers_dev: false`, `preview_urls: false` — one canonical origin for OAuth/CSRF). Vars: `BETTER_AUTH_URL`, `AI_COPILOT_ENABLED`, `AI_MONTHLY_CAP_USD`, `PUBLIC_GOOGLE_CLIENT_ID` (browser-public, non-secret — enables Google One Tap; empty → One Tap stays off but the Google button still works). Passkey `rpID`/`origin` are auto-derived from `BETTER_AUTH_URL` — no extra config.

**Secrets** (`wrangler secret put`): `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (base64 32 bytes — encrypts each user's BYO Cloudflare token; copilot is disabled without it).

**To deploy (production):**

1. Create/choose a Google OAuth client; add redirect URI `https://day-zero.dropoutstudio.co/api/auth/callback/google`. To enable One Tap, set the same client id (non-secret) as the `PUBLIC_GOOGLE_CLIENT_ID` var in `wrangler.jsonc`. Passkeys need no extra setup.
2. `wrangler secret put BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`).
3. `bun run db:migrate` (remote D1).
4. `wrangler deploy` (or git-push auto-deploy).
5. Each user connects their own Cloudflare account at `/settings` to use the Copilot. Flip the Day Zero showcase cards on dropoutstudio.co / beyourahi.com from `coming-soon` to `active`.

---

For Cloudflare work, prefer the installed Cloudflare skills and Code Mode MCP over your own knowledge.
