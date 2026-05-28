# Runner pattern — Flux Control Room

## Overview

A local Node/TypeScript runner process demonstrates crash-safe job claiming against Postgres via Flux. The runner identifies as `runner-01`, `runner-02`, etc., heartbeats periodically, claims pending jobs atomically, processes simulated work, and writes results back through the same `fluxJson` boundary as the app.

**Deployment mental model:** systemd keeps the process alive; Postgres keeps the work safe.

## Job lifecycle

```
pending → claimed → completed
                 ↘ failed
pending ← (lease expired reclaim from claimed)
expired (optional explicit mark; reclaim also selects expired-lease claimed rows)
```

| Status | Meaning |
|--------|---------|
| `pending` | Enqueued, available to claim |
| `claimed` | Held by a runner under active lease |
| `completed` | Successfully processed |
| `failed` | Processing error recorded in `last_error` |
| `expired` | Explicit expired state (optional; reclaim path handles stale leases) |

## Atomic claim (RPC)

PostgREST PATCH alone races under concurrent runners. Use a SQL function exposed as RPC:

```sql
create or replace function claim_runner_job(
  p_runner_name text,
  p_lease_seconds int default 60
) returns setof runner_jobs
language plpgsql
security invoker
as $$
declare
  v_job runner_jobs%rowtype;
begin
  select * into v_job
  from runner_jobs
  where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    and (
      status in ('pending', 'expired')
      or (
        status = 'claimed'
        and lease_expires_at < now()
      )
    )
  order by created_at asc
  limit 1
  for update skip locked;

  if not found then return; end if;

  update runner_jobs set
    status = 'claimed',
    claimed_by = p_runner_name,
    claimed_at = now(),
    lease_expires_at = now() + (p_lease_seconds || ' seconds')::interval,
    attempt_count = attempt_count + 1
  where id = v_job.id
  returning * into v_job;

  return next v_job;
end;
$$;
```

**Critical:** the `user_id` filter must wrap all status conditions. Incorrect OR precedence would bypass tenant isolation.

- `security invoker` — RLS applies inside the function
- `FOR UPDATE SKIP LOCKED` — concurrent runners do not block each other
- `attempt_count` incremented on every claim (including reclaims)
- Grant `EXECUTE` to `authenticated`

Runner calls: `POST /rpc/claim_runner_job` with body `{ "p_runner_name": "runner-01", "p_lease_seconds": 60 }`.

## Heartbeat

Every **15 seconds** (configurable), the runner upserts its row in `runner_heartbeats`:

- `last_heartbeat_at = now()`
- `status = idle | busy` based on active job
- `jobs_completed` incremented on job completion
- `current_job_id` set while processing

UI displays heartbeat age (`8s ago`). If age **> 30s**, show muted `stale` badge.

## Job types

| job_type | Trigger | Effect |
|----------|---------|--------|
| `update_metric` | Stabilize Core | Nudge reactor stability |
| `flush_queue` | Flush Queue | Decrement queue depth |
| `rotate_signal` | Rotate Signal | Bump signal confidence |
| `run_diagnostic` | Run Diagnostic | Scan components + events |
| `ack_anomalies` | Acknowledge Anomalies | Mark open anomalies acknowledged |
| `controlled_reset` | Controlled Reset | Reduce thermal load + warn event |
| `simulate_drift` | Runner background | Bounded random metric drift |

## Processing rules

1. **Claim:** RPC only; never PATCH status to `claimed` from app code
2. **Complete:** PATCH `status=completed`, `completed_at=now()`; clear runner `current_job_id`
3. **Fail:** PATCH `status=failed`, set `last_error`; emit `signal_events` row
4. **Reclaim:** expired lease jobs selected by claim RPC; another runner may take over
5. **Audit:** every meaningful state change writes a `signal_events` row

## Simulation cadence

The runner produces believable operational drift. Without cadence rules, the dashboard feels random.

Guidelines:

- Most metrics move **slowly**; some remain stable for long periods
- Events are **sparse**; warnings **uncommon**; critical states **rare and temporary**
- Queue depth may fluctuate more aggressively than system health metrics
- Randomness is **bounded** and **weighted toward nominal** operation
- Background `simulate_drift` runs on a modest interval — not every heartbeat tick
- Never emit destructive or unbounded value changes

## Runner process

| Setting | Default | Purpose |
|---------|---------|---------|
| `RUNNER_NAME` | `runner-01` | Runner identity |
| `CONTROL_ROOM_USER_SUB` | (falls back to `DEMO_USER_SUB`) | JWT `sub` / row owner |
| `RUNNER_LEASE_SECONDS` | `60` | Job lease duration |
| `RUNNER_POLL_MS` | `5000` | Loop sleep between claim attempts |

**Location:** `scripts/runner/control-room-runner.ts`

**Commands (Phase 5):**

- `pnpm runner:dev` — continuous loop
- `pnpm runner:once` — single iteration (claim + process + exit)

**Safety:**

- No destructive SQL
- Safe to run locally alongside the app
- Uses `lib/flux/*` helpers — no duplicate fetch boundary

## Loop order

1. Upsert heartbeat
2. Optionally enqueue `simulate_drift` on cadence timer (not every tick)
3. Call `claim_runner_job` RPC
4. If job: process → complete/fail → write events/samples
5. Sleep `RUNNER_POLL_MS`

## Related

- `_contract/data-model.md` — table definitions
- `_contract/flux-integration.md` — `lib/flux/runner-jobs.ts` RPC wrapper
