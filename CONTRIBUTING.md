# Contributing to Invoice Generator

Thank you for taking the time to contribute. This document provides everything you need to understand the project's conventions, tooling, and expectations before opening a pull request.

---

## Table of Contents

1. [Contribution Philosophy](#contribution-philosophy)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Coding Standards](#coding-standards)
6. [Git Workflow](#git-workflow)
7. [Commit Message Conventions](#commit-message-conventions)
8. [Reporting Issues and Feature Requests](#reporting-issues-and-feature-requests)
9. [Pull Request Workflow](#pull-request-workflow)
10. [Testing and Validation](#testing-and-validation)
11. [Documentation Standards](#documentation-standards)
12. [Code of Conduct](#code-of-conduct)

---

## Contribution Philosophy

Invoice Generator is a focused, single-purpose tool. Contributions should respect that scope:

- **Solve the problem at hand.** A bug fix does not need surrounding refactors. A new theme does not need a theme-switcher UI unless explicitly requested.
- **Prefer existing abstractions.** Before adding a utility, check `src/lib/` — the resolver, generator, and zip modules already cover the core pipeline.
- **No speculative features.** Implement what is asked, not what might be useful in the future. Three explicit lines beat a premature abstraction.
- **Type safety is non-negotiable.** TypeScript strict mode is enabled. No `any`, no loose casts, no suppression comments.
- **Zero comments in shipped code.** Code should be self-documenting through naming and structure. If the _why_ is truly non-obvious, one short inline comment is acceptable — nothing more.

---

## Local Development Setup

### Prerequisites

| Tool                                                            | Minimum Version | Notes                                 |
| --------------------------------------------------------------- | --------------- | ------------------------------------- |
| [Bun](https://bun.sh)                                           | 1.2+            | Package manager and runtime           |
| [Node.js](https://nodejs.org)                                   | 20.19+ / 22.12+ | Required by Vite 8 and the toolchain  |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | 4.x             | Installed as a dev dependency via Bun |
| Git                                                             | 2.5+            | Required for worktree support         |

### Installation

```bash
git clone <repository-url>
cd invoice-generator
bun install
```

### Running the Development Server

```bash
bun run dev
```

This runs `vite dev --open --host`: it starts the Vite dev server, opens the app in your default browser, and exposes it on your local network.

> **Note:** The Vite dev server does not provide a Cloudflare D1 binding. Authentication will be silently disabled and all routes will treat the session as unauthenticated. Use `bun run preview` (Wrangler-backed) to test auth locally.

### Environment Variables

Two gitignored env files live at the project root, each read by a different tool. Copy the committed templates and fill in the values:

```bash
cp .dev.vars.example .dev.vars   # auth secrets — read by `wrangler dev`
cp .env.example .env             # Cloudflare credentials — read by drizzle-kit
```

`.dev.vars` holds the auth secrets used by local `bun run preview`: `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`), `BETTER_AUTH_URL` (`http://localhost:8787` — the Wrangler dev server), `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. `.env` holds `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_D1_TOKEN` for drizzle-kit's remote D1 commands.

Wrangler reads `.dev.vars` for the Worker runtime — not `.env` — while Bun loads `.env` for `bun run` scripts. Never commit `.dev.vars` or `.env`.

### Database (D1)

Migrations live in `migrations/`. Apply once per environment:

```bash
# Local (Wrangler preview)
bun run db:migrate:local

# Remote (production)
bun run db:migrate
```

### Regenerating Cloudflare Types

After any changes to `wrangler.jsonc`, regenerate the worker type definitions:

```bash
bun run cf-typegen
```

### Clean Rebuild

If the dev server behaves unexpectedly, do a full clean:

```bash
rm -rf node_modules/ .wrangler/ .svelte-kit/ && bun install
```

---

## Project Structure

```
invoice-generator/
├── migrations/                  # D1 SQL migration files
├── src/
│   ├── app.css                  # Tailwind v4 CSS-first config + global styles
│   ├── app.html                 # HTML shell
│   ├── app.d.ts                 # Global TypeScript declarations
│   ├── hooks.server.ts          # Auth session + CSP/security headers
│   ├── hooks.client.ts          # Client-side error handling
│   ├── components/              # Route-level UI components (uses $src alias)
│   │   ├── ai/                  # AI Copilot UI (sidebar, dialogs, mobile sheet)
│   │   └── *.svelte             # ClientCard, FixedSenderPanel, GenerationPanel, etc.
│   ├── lib/
│   │   ├── auth-client.ts       # Better Auth Svelte client
│   │   ├── types.ts             # Shared TypeScript types
│   │   ├── utils.ts             # cn() and shared utilities
│   │   ├── ai/                  # AI Copilot client layer (model, tools, streaming, undo)
│   │   ├── api/
│   │   │   └── client.ts        # Typed fetch wrapper + sync/debounceSync
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── ui/              # shadcn-svelte components (AUTO-GENERATED — do not edit)
│   │   ├── config/
│   │   │   ├── app.ts           # APP_CONFIG (name, description, url, author)
│   │   │   └── index.ts
│   │   ├── format/
│   │   │   └── currency.ts      # formatAmount() + currencySymbol()
│   │   ├── hooks/               # use-current-user() and re-exports
│   │   ├── invoice/
│   │   │   ├── active.ts        # Active-filter helpers (generation queue source)
│   │   │   ├── builder.ts       # buildInvoiceHtml() + ID/filename helpers
│   │   │   ├── months.ts        # MONTHS array + MONTH_TO_NUMBER map
│   │   │   └── resolver.ts      # resolveTokens() — pure token substitution
│   │   ├── payments/
│   │   │   └── registry.ts      # Payment method type definitions
│   │   ├── pdf/
│   │   │   ├── generator.ts            # iframe → html2canvas → jsPDF pipeline
│   │   │   ├── sequential-download.ts  # File System Access API + sequential fallback
│   │   │   └── zip.ts                  # fflate zipSync wrapper
│   │   ├── server/
│   │   │   ├── auth.ts          # createAuth() factory (Better Auth + Drizzle)
│   │   │   ├── schema.ts        # Drizzle schema (all tables)
│   │   │   ├── db.ts            # getDatabase() Drizzle factory
│   │   │   ├── api.ts           # requireApiContext() + request helpers
│   │   │   ├── dto.ts           # Row-to-domain mappers + AppState
│   │   │   ├── validation.ts    # Shared Zod request schemas
│   │   │   ├── ai-quota.ts      # Per-user AI daily turn quota (KV-backed)
│   │   │   ├── ai-spend.ts      # Per-user AI monthly spend cap (KV-backed)
│   │   │   ├── ai-undo.ts       # Server-side action reversal
│   │   │   ├── log.ts           # Structured AI logging
│   │   │   └── repositories/    # D1 data access (clients, payment methods, AI, ...)
│   │   ├── stores/
│   │   │   ├── session.svelte.ts  # Client/invoice state, synced to D1
│   │   │   ├── fixed.svelte.ts    # Sender/bank state, synced to D1
│   │   │   └── ai.svelte.ts       # AI Copilot session state
│   │   └── themes/
│   │       ├── default.ts       # Default invoice theme
│   │       └── registry.ts      # ThemeId → Theme map + ACTIVE_THEME_ID
│   └── routes/
│       ├── +error.svelte        # Error boundary page
│       ├── +layout.svelte       # Footer + app shell
│       ├── +layout.server.ts    # Passes user/session/currentUser + aiEnabled to PageData
│       ├── +page.svelte         # Main invoice app (auth-gated)
│       ├── +page.server.ts      # Auth guard + server-side data hydration
│       ├── api/                 # REST API: clients, payment methods, fixed, AI Copilot, logout
│       └── login/               # Google sign-in page
├── static/                      # Static assets
├── wrangler.jsonc               # Cloudflare Workers config + D1/AI/KV bindings
├── svelte.config.js             # SvelteKit config + path aliases ($src, $lib)
├── vite.config.ts               # Vite config with Tailwind plugin
├── drizzle.config.ts            # Drizzle ORM config
├── tsconfig.json                # TypeScript strict config
├── eslint.config.js             # ESLint 10 flat config
└── components.json              # shadcn-svelte registry config
```

### Path Aliases

| Alias  | Resolves to | Used in                                      |
| ------ | ----------- | -------------------------------------------- |
| `$lib` | `src/lib/`  | Library files, stores, utilities             |
| `$src` | `src/`      | Route files importing from `src/components/` |

Never use relative paths from route files. Always use the appropriate alias.

---

## Architecture Guidelines

### PDF Pipeline (client-side only)

The entire PDF generation pipeline runs in the browser. No server actions, no API routes:

1. `active.ts` resolves the generation queue — only clients and entries that are both active
2. `builder.ts` assembles the HTML document string from the theme template and client data
3. `generator.ts` injects that HTML into a hidden off-screen `<iframe>`, waits for fonts, captures it with `html2canvas` at 2× scale, then writes to jsPDF
4. `sequential-download.ts` saves the generated Blobs via the File System Access API (directory picker) or sequential downloads; `zip.ts` is the ZIP fallback

**Critical constraints:**

- PDF generation is sequential and blocking by design. Do not parallelize `generatePdf()` calls — concurrent canvas operations cause corruption.
- The iframe uses `position: fixed; top: -9999px; left: -9999px; visibility: hidden`. Do not change this. `display: none` prevents `html2canvas` from rendering.
- Token substitution uses `String.prototype.replaceAll` — not regex. Tokens are case-sensitive literals (e.g. `{MONTH}`).

### Store Pattern

All three stores use the factory function + `$state` closure pattern, exported as singletons:

- `session.svelte.ts` — client/invoice state and the generation lifecycle, synced to D1
- `fixed.svelte.ts` — sender/bank data, synced to D1
- `ai.svelte.ts` — AI Copilot conversations, messages, and chat UI state

Each store exposes a `hydrate()` method seeded once from server-loaded data inside `+page.svelte`'s `untrack()` block. Never call `hydrate()` a second time or at module scope.

### Theme System

Themes are registered in `$lib/themes/registry.ts`. `ACTIVE_THEME_ID` is hardcoded — there is no runtime switcher. Adding a theme means implementing the `Theme` interface and registering it in the `themes` map.

### Authentication

Google OAuth via Better Auth is the only sign-in method. `emailAndPassword` is explicitly disabled. The server layer handles auth session management, plus D1 data persistence and AI Copilot inference via the REST API under `src/routes/api/`. The PDF pipeline is unaffected by auth state and stays entirely client-side.

### shadcn-svelte Components

Files under `src/lib/components/ui/` are auto-generated by the shadcn-svelte CLI. **Never modify them by hand.** Create wrapper components in other directories. Add or update components via:

```bash
bunx shadcn-svelte@latest add <component>
```

---

## Coding Standards

### Svelte 5 Runes (mandatory)

Use Svelte 5 rune syntax exclusively. Legacy `export let`, `$:` reactive statements, and `writable` stores are not permitted in component files.

```svelte
<script lang="ts">
	// Props
	let { client, onUpdate }: ClientCardProps = $props();

	// State
	let expanded = $state(false);

	// Derived
	let isValid = $derived(client.name.length > 0);

	// Effects — only for side effects with external systems
	$effect(() => {
		document.title = client.name;
	});
</script>
```

Use `onMount` for DOM/lifecycle work. Use `$effect` only when reacting to reactive state changes that must synchronize with an external system.

### TypeScript

- Strict mode is enforced (`tsconfig.json`). No `any`. No type assertions (`as T`) without justification.
- Use `import type { ... }` for type-only imports.
- Define all component prop types explicitly — never implicit.
- Use `cn()` from `$lib/utils` for conditional class merging.

### Tailwind CSS v4

Configuration lives entirely in `src/app.css` under `@theme inline`. There is no `tailwind.config.js` — do not create one.

```css
/* Correct — extend via @theme inline in app.css */
@theme inline {
	--color-brand: oklch(0.62 0.21 265);
}
```

- Never hardcode hex, rgb, or oklch values directly in class attributes.
- The design is dark-only. No light mode. All `--color-*` tokens are dark values.
- CSS variables for all colors — class utilities reference variables, not raw values.

### Arrow Functions

```typescript
// Correct
const generateAll = async () => { ... };
const getFileName = (client: Client) => `${client.name}.pdf`;

// Wrong — no function declarations
function generateAll() { ... }
```

### Formatting

| Setting               | Value                   |
| --------------------- | ----------------------- |
| Indentation           | Tabs                    |
| Tab width (`.svelte`) | 4 spaces                |
| Quotes                | Double                  |
| Trailing commas       | None                    |
| Print width           | 100 (120 for `.svelte`) |
| Arrow parens          | Avoid (`x => x`)        |

Run Prettier before committing:

```bash
bun run format
```

### Comments

Write zero comments in shipped code. If the _why_ behind a decision is genuinely non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific upstream bug — one short line is acceptable. Never write multi-line comment blocks or JSDoc in application code.

---

## Git Workflow

This project uses **git worktrees** for parallel development. **Never create branches.**

### Why Worktrees Instead of Branches

- Multiple contributors (or AI agents) can work on separate features simultaneously without stashing or checkout conflicts.
- Git history remains linear and readable.
- No branch management overhead.

### Working with Worktrees

```bash
# Start work on a new feature
cd invoice-generator
git worktree add ../invoice-generator-<feature-name>
cd ../invoice-generator-<feature-name>

# List all active worktrees
git worktree list

# Remove a worktree when the work is merged
git worktree remove ../invoice-generator-<feature-name>

# Clean up stale references
git worktree prune
```

Each worktree shares the same `.git` directory, so commits from any worktree are immediately visible to all others.

### Merging Work

Once your changes are validated (see [Testing and Validation](#testing-and-validation)), merge them directly into `main` from the worktree. There are no feature branch PRs in the traditional sense — submit your changes as a patch or merge commit against `main`.

---

## Commit Message Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>: <short description>

[optional body — explains why, not what]
```

### Types

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or capability                  |
| `fix`      | Bug fix                                    |
| `refactor` | Code restructuring with no behavior change |
| `style`    | Visual or UI-only changes                  |
| `chore`    | Tooling, config, dependencies              |
| `docs`     | Documentation changes                      |
| `perf`     | Performance improvements                   |
| `test`     | Adding or updating tests                   |

### Rules

- Subject line: 50–70 characters, imperative mood ("add", "fix", "remove" — not "added", "fixes")
- Body: optional; explain _why_, not _what_
- One logical change per commit (atomic)
- Never commit `.env`, `.dev.vars`, or any file containing secrets
- The build must pass at every commit — no broken intermediate states

### Examples

```
feat: add ZIP download button to generation panel

fix: prevent canvas corruption when generating multiple PDFs sequentially

refactor: extract invoice filename logic into standalone helper

chore: remove unused gsap dependency
```

---

## Reporting Issues and Feature Requests

### Before Opening an Issue

1. Search existing issues to avoid duplicates.
2. Confirm the problem is reproducible on the latest commit of `main`.
3. For PDF rendering issues, test across Chrome and Firefox — `html2canvas` behavior differs between browsers.

### Issue Content

A useful bug report includes:

- **Environment**: Browser, OS, Bun version, Wrangler version
- **Steps to reproduce**: Minimal, numbered, and precise
- **Expected behavior**: What should have happened
- **Actual behavior**: What happened instead
- **Screenshots or console output**: Attach where relevant

A useful feature request includes:

- **Problem statement**: What are you trying to accomplish?
- **Proposed solution**: How would you implement it?
- **Alternatives considered**: What else did you explore?
- **Scope consideration**: Does this fit within the tool's focused purpose?

Features that expand scope significantly (e.g. a theme switcher, multi-user workspaces, server-side PDF rendering) require explicit discussion before implementation begins.

---

## Pull Request Workflow

### Before Opening a PR

Run the full validation suite and confirm everything passes:

```bash
bun run format       # Auto-format all files
bun run lint         # ESLint validation
bun run check        # svelte-check TypeScript validation
```

No PR should be opened with failing lint or type errors.

### PR Checklist

Before marking a PR ready for review, confirm:

- [ ] `bun run lint` passes with no errors or warnings
- [ ] `bun run check` passes with no TypeScript errors
- [ ] `bun run format` has been run and changes are committed
- [ ] The build succeeds: `bun run build`
- [ ] No `.env`, `.dev.vars`, or secret values are committed
- [ ] No `tmp_screenshots/` or `.playwright-mcp/` directories are committed
- [ ] No `any` types or suppressed TypeScript errors introduced
- [ ] No legacy Svelte patterns (`export let`, `$:`) introduced in component files
- [ ] No relative imports from route files (use `$lib` or `$src` aliases)
- [ ] No modifications to files under `src/lib/components/ui/` (auto-generated)
- [ ] PDF pipeline remains entirely client-side (no server actions added to the generation flow)
- [ ] Commit messages follow Conventional Commits format
- [ ] Each commit builds independently (no broken intermediate states)

### PR Description

Include:

- **What changed**: Brief summary of the modification
- **Why**: Motivation or issue reference
- **How to test**: Steps to verify the change manually
- **Screenshots**: For any UI changes, attach before/after screenshots

### Review Expectations

- Reviewers will check for adherence to the coding standards and architecture guidelines above.
- Feedback is focused on correctness, scope, and consistency — not style preferences that Prettier already handles.
- Address review comments with follow-up commits, not force-pushes.
- Once approved, the author merges.

---

## Testing and Validation

There is currently no automated test suite configured. Validation is done through the type checker, linter, and manual testing.

### Required Validation Steps

```bash
bun run check        # svelte-check — catches TypeScript errors and Svelte-specific issues
bun run lint         # ESLint — enforces code quality rules
bun run format       # Prettier — enforces consistent formatting
bun run build        # Confirms the production build succeeds
```

Run all four before every commit. Never commit a build that fails any of these.

### Manual Testing

For changes touching the invoice pipeline:

1. Start `bun run dev` and open the app.
2. Fill in sender and bank details in `FixedSenderPanel`.
3. Add at least two clients, each with multiple invoice entries across different months.
4. Generate invoices and verify:
   - File names match the format `invoice-{PREFIX}-{MMDD}-{YEAR}.pdf`
   - Invoice IDs match `{PREFIX}-{MMDD}-{YEAR}`
   - `{MONTH}` token substitutes correctly in service descriptions
   - Directory-picker and sequential downloads save files under `invoices/`, with a `{ClientName}-{Year}-Invoices/` subfolder per multi-invoice client
   - The ZIP fallback produces a valid archive with the same folder structure
5. Test with a single client and a single invoice entry as well.

For changes touching auth:

1. Use `bun run preview` (Wrangler-backed) with `.dev.vars` configured.
2. Verify the Google OAuth redirect flow completes successfully.
3. Verify that `/login` redirects to `/` when already authenticated.
4. Verify that `/` redirects to `/login` when unauthenticated.

### Adding Tests

When tests are added, use [Vitest](https://vitest.dev/) — it integrates with the existing Vite setup. Place test files alongside source files using the `.test.ts` suffix:

```
src/lib/invoice/resolver.test.ts
src/lib/invoice/builder.test.ts
src/lib/pdf/zip.test.ts
```

Priority test targets are the pure functions: `resolver.ts` (token substitution), `builder.ts` (ID/filename format), and `zip.ts` (archive path generation).

---

## Documentation Standards

### CLAUDE.md

`CLAUDE.md` at the project root is the authoritative reference for AI coding assistants. Keep it accurate and up-to-date when making architectural changes. Structure follows the template defined in the workspace-level `CLAUDE.md`.

### Code Comments

Ship zero comments by default. The only acceptable comment is one that explains a non-obvious _why_: a subtle invariant, a workaround for a specific upstream bug, or a hidden external constraint. Never describe _what_ the code does — that belongs in the names and structure of the code itself.

---

## Code of Conduct

This project adopts the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold these standards. Instances of unacceptable behavior may be reported to the project maintainer at **beyourahi@gmail.com**.
