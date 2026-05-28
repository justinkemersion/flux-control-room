# Flux Control Room

A mobile-first, Flux-powered operational dashboard demo for **Vessel Reactor One** — a fictional facility with real Postgres-backed state, job claiming, and a background runner.

**Conceptual centerpiece:** *systemd keeps the process alive; Postgres keeps the work safe.*

Postgres-backed operations, simulated in real time.

## What this demonstrates

- Flux integration via `fluxJson` (single HTTP boundary)
- RLS-first tenant schema and numbered migrations
- Server actions + RSC reads (no WebSockets)
- Lease-based job claiming with `FOR UPDATE SKIP LOCKED`
- Mobile-first industrial control-room UI
- Background runner process writing metrics, events, and heartbeats

Generic Foundry CRUD routes (`/records`, `/activity`, `/settings/profile`) remain in the repository as **reference scaffolding** for developers exploring the codebase. They are hidden from the default nav.

## Stack

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- Auth.js v5 (GitHub and/or Google)
- Flux / PostgREST / PostgreSQL with RLS
- pnpm, Vitest, GitHub Actions CI

## Quick start

```bash
pnpm install
cp .env.example .env
# AUTH_SECRET, OAuth provider, FLUX_URL, FLUX_GATEWAY_JWT_SECRET
pnpm foundry:doctor
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then open **`/control-room`**.

## Flux setup

Create the Flux project **before** domain SQL. Full guide: [`docs/FLUX_WORKFLOW.md`](docs/FLUX_WORKFLOW.md).

```bash
flux login
flux init                    # writes hash to flux.json
flux push sql/migrations/0001_profiles.sql
# … push each migration in order through 0008_runner_claim_rpc.sql
pnpm flux:schema:sync
pnpm flux:doctor
```

After sign-in, set `CONTROL_ROOM_USER_SUB` (or `DEMO_USER_SUB`) to your OAuth account id, then seed:

```bash
pnpm seed:control-room
```

## Runner

In a second terminal (same `.env`):

```bash
pnpm runner:dev      # continuous loop
pnpm runner:once     # single claim/process cycle
```

Configure with `RUNNER_NAME` (default `runner-01`), `RUNNER_LEASE_SECONDS`, `RUNNER_POLL_MS`.

### How leases work

1. Operator action or drift cadence enqueues a `runner_jobs` row (`pending`)
2. Runner calls `POST /rpc/claim_runner_job` — atomic claim + lease timestamp
3. Runner processes the job and marks it `completed` or `failed`
4. If the runner crashes, the lease expires; another runner reclaims the job

Inspect state in Postgres (tenant API schema) or via the `/control-room` dashboard.

## Architecture

```txt
Mobile/Desktop UI
  ↓
Next.js App / Server Actions
  ↓
Flux API (fluxJson)
  ↓
Postgres tenant schema
  ↓
runner_jobs / metrics / events / anomalies

Runner Process
  ↓ claims jobs (RPC)
  ↓ writes heartbeats
  ↓ updates metrics
  ↓ emits events
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm seed:control-room` | Seed Vessel Reactor One nominal state |
| `pnpm runner:dev` | Background runner loop |
| `pnpm runner:once` | Single runner iteration |
| `pnpm flux:doctor` | Flux control plane + gateway probes |
| `pnpm foundry:doctor` | Full app preflight |
| `pnpm foundry:verify` | Lint, typecheck, test, drift, build |
| `pnpm foundry:verify:template` | CI gate without `.env` |

## Contracts and plans

- Domain contracts: `_contract/product-lane.md`, `data-model.md`, `runner-pattern.md`, `ui-mobile-first.md`, `flux-integration.md`
- Master plan: `plans/011-flux-control-room-foundation.md`
- Fork baseline: `FOUNDRY_BASELINE.md`

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Empty control room after sign-in | Set `CONTROL_ROOM_USER_SUB` to your OAuth sub; run `pnpm seed:control-room` |
| Flux 403 / schema errors | Run `pnpm flux:schema:sync` and `pnpm flux:doctor` |
| Runner finds no jobs | Trigger an operator action from `/control-room` or wait for drift cadence |
| Stale runner badge | Start `pnpm runner:dev`; heartbeats mark stale after 30s |

## Screenshots

_Coming soon._

## What to try next

1. Trigger **Stabilize Core** and watch the runner complete the job
2. Stop the runner mid-job, wait for lease expiry, restart — observe reclaim
3. Explore reference CRUD routes at `/records` to compare Foundry patterns
4. Read `_contract/runner-pattern.md` for simulation cadence rules

## Identity

`session.user.id` is the OAuth provider account id. It becomes the JWT `sub` and all `user_id` columns. Flux is never called from the browser.

Based on [`flux-app-foundry`](https://github.com/justinkemersion/flux-app-foundry).
