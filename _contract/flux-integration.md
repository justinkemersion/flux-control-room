# Flux integration — Flux Control Room

## Boundary invariant

All Flux / PostgREST HTTP for Control Room domain data goes through `lib/flux/client.ts` → `fluxJson(sub, path, init)`. No raw `fetch` to `FLUX_URL` elsewhere (enforced by Vitest).

Runner and seed scripts import domain helpers from `lib/flux/*` — they do not duplicate the HTTP boundary.

See also: `_contract/flux.md`, `_contract/flux-workflow.md`.

## Identity

| Context | `sub` source |
|---------|--------------|
| RSC pages / server actions | `session.user.id` from `auth()` |
| Seed script | `CONTROL_ROOM_USER_SUB` or `DEMO_USER_SUB` |
| Runner | `CONTROL_ROOM_USER_SUB` or `DEMO_USER_SUB` |

All row `user_id` columns must match the JWT `sub`.

## Environment

| Variable | Purpose |
|----------|---------|
| `FLUX_URL` | PostgREST base URL |
| `FLUX_GATEWAY_JWT_SECRET` | JWT signing secret |
| `FLUX_POSTGREST_SCHEMA` | From `pnpm flux:schema:sync` (`.env.local` only) |
| `CONTROL_ROOM_USER_SUB` | Facility data owner for seed + runner |
| `DEMO_USER_SUB` | Fallback when `CONTROL_ROOM_USER_SUB` unset |
| `RUNNER_NAME` | Runner identity (default `runner-01`) |
| `RUNNER_LEASE_SECONDS` | Job lease (default `60`) |
| `RUNNER_POLL_MS` | Runner loop sleep (default `5000`) |

## Domain modules (`lib/flux/`)

| Module | Functions | PostgREST paths |
|--------|-----------|-----------------|
| `control-metrics.ts` | `listMetrics`, `listSamples`, `patchMetric`, `insertSample` | `/control_metrics`, `/metric_samples` |
| `signal-events.ts` | `listEvents`, `createEvent` | `/signal_events` |
| `runner-jobs.ts` | `listJobs`, `createJob`, `claimJob`, `completeJob`, `failJob` | `/runner_jobs`, `/rpc/claim_runner_job` |
| `runner-heartbeats.ts` | `listHeartbeats`, `upsertHeartbeat` | `/runner_heartbeats` |
| `anomalies.ts` | `listAnomalies`, `patchAnomaly` | `/anomalies` |
| `operator-actions.ts` | `listOperatorActions`, `createOperatorAction` | `/operator_actions` |
| `system-components.ts` | `listComponents`, `patchComponent` | `/system_components` |
| `types.ts` | Row types for all above | — |

### List queries

```
GET /control_metrics?order=metric_key.asc
GET /signal_events?order=created_at.desc&limit=50
GET /runner_jobs?status=eq.pending&order=created_at.asc
GET /runner_heartbeats?order=runner_name.asc
GET /anomalies?status=in.(open,acknowledged)&order=first_seen_at.desc
GET /system_components?order=component_key.asc
GET /metric_samples?metric_id=eq.{id}&order=recorded_at.desc&limit=24
```

RLS scopes rows to JWT `sub`; explicit `user_id=eq.{sub}` filters are optional when RLS alone suffices.

### Inserts

```typescript
await fluxJson<Row[]>(sub, "/runner_jobs", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    user_id: sub,
    job_type: "update_metric",
    payload: { action: "stabilize_core" },
    status: "pending",
  }),
});
```

### Patches

```typescript
await fluxJson<Row[]>(sub, `/control_metrics?id=eq.${id}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ current_value: 92.4, updated_at: new Date().toISOString() }),
});
```

### RPC claim

```typescript
await fluxJson<RunnerJobRow[]>(sub, "/rpc/claim_runner_job", {
  method: "POST",
  body: JSON.stringify({
    p_runner_name: process.env.RUNNER_NAME ?? "runner-01",
    p_lease_seconds: 60,
  }),
});
```

Wrap in `claimJob(sub, runnerName)` in `runner-jobs.ts`.

## Server actions

Location: `app/(dashboard)/actions/control-room.ts`

Flow for operator actions:

1. `auth()` → `sub`
2. Zod validate `action_key` against allowed enum
3. `createOperatorAction(sub, …)`
4. `createJob(sub, …)` with matching `job_type`
5. `createEvent(sub, …)` severity `info`, source `operator`
6. `revalidatePath("/control-room")`
7. Return `{ ok: true }` or `{ ok: false, error: string }`

Catch `FluxHttpError`; never expose raw Flux bodies to client.

## RSC page reads

`app/(dashboard)/control-room/page.tsx`:

- `auth()` → `sub`
- Parallel fetch via domain helpers
- Try/catch for Flux-unavailable local dev (match dashboard pattern)
- Pass serializable props to section components

## Migrations workflow

1. Author SQL under `sql/migrations/0006+`
2. `flux push sql/migrations/<file>.sql` in order
3. `pnpm flux:schema:sync`
4. `pnpm flux:doctor`

Unqualified table names only. Never hardcode `t_*_api`.

## Seed script

`scripts/seed-control-room.ts` — uses domain helpers + `CONTROL_ROOM_USER_SUB`.

Package script (Phase 2): `pnpm seed:control-room`

## Error handling

- Server actions: catch `FluxHttpError`, return `{ ok: false, error: "…" }`
- RSC: graceful empty/error UI when Flux unavailable
- Runner: log and continue loop on transient errors; fail job on processing errors

## Related

- `_contract/runner-pattern.md` — claim semantics and cadence
- `_contract/data-model.md` — table definitions
