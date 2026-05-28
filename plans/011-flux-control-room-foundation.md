# Plan 011 — Flux Control Room foundation

**Where:** This repo (`flux-control-room`) — fork of `flux-app-foundry`.

**Conceptual centerpiece:** *systemd keeps the process alive; Postgres keeps the work safe.*

## Product overview

Flux Control Room is a mobile-first operational dashboard demo for **Vessel Reactor One**. It demonstrates Flux integration, CRUDe app structure, Postgres-backed state, and background runner patterns using simulated telemetry.

**Primary route:** `/control-room` (protected). **`/`** remains marketing + sign-in.

**Reference scaffolding:** Generic Foundry CRUD routes (`/records`, `/activity`, `/settings/profile`) remain in the codebase and reachable by direct URL — hidden from default nav but preserved for developers exploring the repository.

## Scope

- 7 dashboard sections (status, metrics, runners, events, anomalies, operator actions, system health)
- 8 Postgres tables + claim RPC (migrations `0006`–`0008`)
- Seed script for nominal initial state
- Local Node/TS runner with lease-based job claiming
- Mobile-first dark industrial UI

## Non-goals

- Real nuclear/safety/financial logic
- WebSockets, Kafka, external services
- Heavy chart libraries
- Multi-facility / multi-operator roles
- Recurring scheduled jobs (future only)
- Authentication beyond Foundry defaults

## UX principles

See `_contract/ui-mobile-first.md`:

- Operational calm — nominal most of the time
- Warnings rare; critical temporary
- Dark graphite/slate surfaces, thin borders, quiet green/amber/red
- Monospace numbers; small labels; dense but readable
- Heartbeat age on runner cards (`stale` if > 30s)

## Mobile-first layout plan

| Order | Section | Mobile | Desktop |
|-------|---------|--------|---------|
| 1 | StatusSummary | Full width | Full width |
| 2 | MetricsGrid | Stacked | 3×2 grid |
| 3 | RunnerPanel | Stacked | Left column with SystemHealth |
| 4 | EventFeed | Full width | Left half |
| 5 | AnomaliesPanel | Full width | Right half |
| 6 | OperatorActions | 2-col grid | Single row |
| 7 | SystemHealth | Full width | Right column with Runners |

Refresh: RSC + manual Refresh button; no WebSockets; optional auto-refresh ≥ 30s later.

## Data model

See `_contract/data-model.md`.

Tables: `control_metrics`, `metric_samples`, `signal_events`, `runner_jobs`, `runner_heartbeats`, `anomalies`, `operator_actions`, `system_components`.

Derived system status: `nominal` | `degraded` | `critical` (computed in app).

## Runner / job-claiming architecture

See `_contract/runner-pattern.md`.

- Atomic claim via `claim_runner_job()` RPC with `FOR UPDATE SKIP LOCKED`
- Leases with reclaim after expiry
- `security invoker`; `user_id` filter wraps all reclaim predicates
- Heartbeat every 15s; loop via `pnpm runner:dev`
- Simulation cadence: slow drift, sparse events, nominal-weighted randomness

## Operator actions

| action_key | Label | job_type |
|------------|-------|----------|
| `stabilize_core` | Stabilize Core | `update_metric` |
| `flush_queue` | Flush Queue | `flush_queue` |
| `rotate_signal` | Rotate Signal | `rotate_signal` |
| `run_diagnostic` | Run Diagnostic | `run_diagnostic` |
| `ack_anomalies` | Acknowledge Anomalies | `ack_anomalies` |
| `controlled_reset` | Controlled Reset | `controlled_reset` |

Server actions enqueue jobs + write `operator_actions` + `signal_events`.

## Seed / simulation strategy

`pnpm seed:control-room` (Phase 2):

- 5 system components (all healthy)
- 8 metrics with ~24 samples each
- 3 runner heartbeats (runner-01..03)
- ~12 historical events
- 0–1 low-severity anomaly max
- Empty job queue
- Nominal system status

Requires `CONTROL_ROOM_USER_SUB` or `DEMO_USER_SUB`.

## Flux integration points

See `_contract/flux-integration.md`.

- Domain helpers in `lib/flux/*`
- All HTTP via `fluxJson`
- Server actions in `app/(dashboard)/actions/control-room.ts`
- RSC reads in `app/(dashboard)/control-room/page.tsx`

## Security / RLS assumptions

- Standard Foundry RLS on all tables (`sub = user_id`)
- Runner + UI share same `CONTROL_ROOM_USER_SUB` in dev
- Operator actions validated server-side (Zod enum)
- No elevated DB roles; RPC uses `security invoker`

## Development phases

### Phase 1 — Contract and architecture ✅

- [x] Clone fork + rebrand metadata
- [x] `_contract/product-lane.md`
- [x] `_contract/data-model.md`
- [x] `_contract/runner-pattern.md`
- [x] `_contract/ui-mobile-first.md`
- [x] `_contract/flux-integration.md`
- [x] This plan file
- [x] Update `FOUNDRY_BASELINE.md`

### Phase 2 — Schema and seed

- [x] `0006_control_room_entities.sql`
- [x] `0007_control_room_grants.sql`
- [x] `0008_runner_claim_rpc.sql`
- [ ] `flux push` each file in order (requires Flux project)
- [ ] `pnpm flux:schema:sync` + `pnpm flux:doctor`
- [x] `scripts/seed-control-room.ts` + `pnpm seed:control-room`
- [ ] Verify PostgREST reads (after flux push)

### Phase 3 — Read-only dashboard

- [x] `app/(dashboard)/control-room/page.tsx`
- [x] `components/control-room/*` section components
- [x] Dark tokens in `app/globals.css`
- [x] Loading / empty / error states
- [x] Hide generic nav items; add Control Room link
- [x] Mobile shell adjustments

### Phase 4 — Operator actions

- [x] `app/(dashboard)/actions/control-room.ts`
- [x] Wire 6 operator buttons
- [ ] Verify job + event rows on action (after flux push + seed)

### Phase 5 — Runner MVP

- [x] `scripts/runner/control-room-runner.ts`
- [x] `pnpm runner:dev` + `pnpm runner:once`
- [ ] End-to-end: action → claim → process → UI refresh (after flux push)
- [ ] Stale lease reclaim test (manual)

### Phase 6 — Polish / public demo

- [x] README: setup, architecture diagram, troubleshooting, leases
- [x] Lead with *systemd keeps the process alive; Postgres keeps the work safe.*
- [x] Note generic CRUD as reference scaffolding
- [x] Screenshots placeholder
- [ ] `pnpm foundry:verify` green (requires `.env` + `flux init`)

## Verification checklist

| Gate | Phase | Command / check |
|------|-------|-----------------|
| Contracts | 1 | `pnpm check:contracts` |
| Install | 2+ | `pnpm install` |
| Lint | 2+ | `pnpm lint` |
| Types | 2+ | `pnpm typecheck` |
| Tests | 2+ | `pnpm test` |
| Build | 3+ | `pnpm build` |
| Flux doctor | 2+ | `pnpm flux:doctor` |
| Foundry doctor | 2+ | `pnpm foundry:doctor` |
| Migrations | 2 | `flux push sql/migrations/0006_*.sql` … `0008_*.sql` |
| Mobile UI | 3 | `/control-room` at 390px — status first |
| Desktop UI | 3 | `/control-room` at 1280px — grid |
| Seed | 2 | `pnpm seed:control-room` |
| Operator | 4 | Stabilize Core → pending job |
| Runner | 5 | `pnpm runner:once` → job completed |
| Heartbeat age | 3 | `8s ago`; stale after 30s |
| Reclaim | 5 | Expired lease → second runner claims |
| Events | 4–5 | Feed updates from operator + runner |
| Invariants | all | No hardcoded tenant schema; no shim; `fluxJson` only |

## Future expansion (not MVP)

- Recurring jobs (`recurring`, `next_run_at` on `runner_jobs`)
- Multi-facility per user
- systemd unit docs for hosted demo
- Stale job sweeper cron
- SSE / Flux realtime if platform supports cleanly
- Role-based operators (viewer vs operator)
- Event log CSV export
- Sparkline time range selector

## Architecture diagram

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

## Related contracts

- `_contract/product-lane.md`
- `_contract/data-model.md`
- `_contract/runner-pattern.md`
- `_contract/ui-mobile-first.md`
- `_contract/flux-integration.md`

## Exit (full project)

A signed-in operator opens `/control-room` on mobile or desktop, sees seeded nominal state, triggers operator actions that enqueue jobs, a local runner claims and processes them, metrics/events update, stale leases reclaim safely — all on Flux with RLS, passing `pnpm foundry:verify`.
