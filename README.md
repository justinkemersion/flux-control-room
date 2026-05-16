# flux-app-foundry

A disciplined Flux-first CRUDe application system for contract-driven, anti-drift development with Cursor.

## Stack

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- Auth.js v5 (GitHub and/or Google — whichever env vars are set)
- Flux / PostgREST / PostgreSQL with RLS-first schema
- pnpm, Vitest, GitHub Actions CI

## Quick start

```bash
pnpm install
cp .env.example .env
# Set AUTH_SECRET, at least one OAuth provider, FLUX_URL, FLUX_GATEWAY_JWT_SECRET
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, then use `/dashboard`.

## Flux setup

1. Create or link a Flux project; update `flux.json` slug/hash after `flux init`.
2. Apply migrations in order under `sql/migrations/`.
3. Replace `{{FLUX_API_SCHEMA}}` in `0003_profiles_flux_api_schema.sql` with your API schema name from `flux push`.
4. Set `FLUX_POSTGREST_SCHEMA` to that schema in `.env`.

```bash
flux push   # when Flux CLI is configured
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server |
| `pnpm test` | Vitest + contract checks |
| `pnpm check:drift` | File size, import boundaries, contracts |
| `pnpm seed:demo` | Seed sample data (`DEMO_USER_SUB` required) |

## Cursor workflow

1. Read `_contract/` and the active `plans/NNN-*.md`
2. Use `prompts/` templates for repeatable tasks
3. Run `pnpm test` and `pnpm check:drift` before finishing

## Repository layout

- `_contract/` — enforceable architectural laws
- `plans/` — phased execution checklists
- `prompts/` — reusable Cursor prompts
- `lib/flux/` — single Flux HTTP boundary
- `sql/migrations/` — RLS-first schema

## Identity

`session.user.id` is the OAuth provider account id. It becomes the JWT `sub` and all `user_id` columns. Flux is never called from the browser.
