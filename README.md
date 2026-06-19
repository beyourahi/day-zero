# Day Zero

A goal/milestone **countdown tracker** by [Dropout Studio](https://dropoutstudio.co). Create a countdown toward a target date for something you want to achieve, make as many as you like, and see them all at once on one clean board — the soonest goal promoted to a hero, the rest in a responsive grid, reached goals in a quieter section. Share any countdown with a read-only public link. An AI copilot lets you manage countdowns in plain language. **No ads.**

A sibling of [order-processor](https://github.com/beyourahi/order-processor) and [invoice-generator](https://github.com/beyourahi/invoice-generator) — same stack, same Dropout Design System.

## Stack

SvelteKit 2 (Svelte 5 runes) · TypeScript (strict) · Tailwind CSS v4 (CSS-first) · Dropout Design System (`@dropout/ds`, vendored at `src/lib/ds/`) + shadcn-svelte · Better Auth (Google OAuth) · Cloudflare D1 + Drizzle ORM · Cloudflare Workers AI (copilot) · GSAP · Bun. Deploys to Cloudflare Workers.

## Develop

```bash
bun install
bun run dev          # vite dev (bindings via platformProxy + .dev.vars)
bun run check        # svelte-check (strict)
bun run lint         # eslint
bun run build        # production build (Cloudflare adapter)
bun run db:migrate:local   # apply migrations to local D1
```

Local auth: set `E2E_BYPASS_AUTH=true` in `.dev.vars` to bypass Google OAuth during development.

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, and deploy steps.
