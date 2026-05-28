# Data model — Flux Control Room

## Principles

- All project-facing tables live in the tenant API schema context (unqualified names in SQL)
- Every table includes `id uuid` PK and `user_id text not null`
- RLS uses the Foundry invariant on all policies (see `_contract/database.md`)
- Enums via `text` + `check` constraints (Foundry pattern)
- Migrations numbered `0006+` only — never edit upstream `0001`–`0005`

## Tables

### `control_metrics`

Current metric definitions and live values.

| Column | Type | Notes |
|--------|------|-------|
| `metric_key` | text | Unique per user; stable identifier |
| `label` | text | Display name |
| `unit` | text | e.g. `%`, `kPa`, `ms`, `count` |
| `current_value` | numeric | Latest value |
| `status` | text | `nominal`, `warning`, `critical` |
| `updated_at` | timestamptz | Last value change |

**Unique:** `(user_id, metric_key)`

**Seed metric keys:**

| metric_key | label | unit |
|------------|-------|------|
| `reactor_stability` | Reactor stability | index |
| `thermal_load` | Thermal Load | °C |
| `loop_pressure` | Loop Pressure | kPa |
| `signal_confidence` | Signal confidence | % |
| `queue_depth` | Queue depth | count |
| `system_load` | System load | % |
| `db_pool_utilization` | Database pool utilization | % |
| `gateway_latency` | Gateway latency | ms |

### `metric_samples`

Historical samples for sparklines.

| Column | Type | Notes |
|--------|------|-------|
| `metric_id` | uuid FK | → `control_metrics.id` |
| `value` | numeric | Sample value |
| `recorded_at` | timestamptz | Sample timestamp |

**Index:** `(user_id, recorded_at desc)` via metric_id lookups

### `signal_events`

Operational event feed.

| Column | Type | Notes |
|--------|------|-------|
| `severity` | text | `info`, `warn`, `error`, `critical` |
| `source` | text | e.g. `operator`, `runner-01`, `system` |
| `message` | text | Human-readable summary |
| `metadata` | jsonb | Optional structured context |
| `created_at` | timestamptz | Event time |

### `runner_jobs`

Work queue with lease-based claiming.

| Column | Type | Notes |
|--------|------|-------|
| `job_type` | text | See `_contract/runner-pattern.md` |
| `payload` | jsonb | Job parameters |
| `status` | text | `pending`, `claimed`, `completed`, `failed`, `expired` |
| `claimed_by` | text | Runner name when claimed |
| `claimed_at` | timestamptz | Claim timestamp |
| `lease_expires_at` | timestamptz | Lease deadline |
| `attempt_count` | int | Incremented on each claim |
| `last_error` | text | Failure message |
| `completed_at` | timestamptz | Completion time |
| `created_at` | timestamptz | Enqueue time |

**Index:** `(user_id, status, lease_expires_at)`

### `runner_heartbeats`

Runner liveness and stats.

| Column | Type | Notes |
|--------|------|-------|
| `runner_name` | text | e.g. `runner-01` |
| `status` | text | `idle`, `busy`, `offline` |
| `last_heartbeat_at` | timestamptz | Updated each heartbeat |
| `current_job_id` | uuid FK nullable | Active job |
| `jobs_completed` | int | Lifetime counter |
| `metadata` | jsonb | Optional extras |

**Unique:** `(user_id, runner_name)`

### `anomalies`

Detected or simulated anomalies.

| Column | Type | Notes |
|--------|------|-------|
| `title` | text | Short description |
| `severity` | text | `low`, `medium`, `high`, `critical` |
| `status` | text | `open`, `acknowledged`, `resolved` |
| `first_seen_at` | timestamptz | Detection time |
| `resolved_at` | timestamptz nullable | Resolution time |
| `metadata` | jsonb | Optional context |

### `operator_actions`

Audit log of operator button presses.

| Column | Type | Notes |
|--------|------|-------|
| `action_key` | text | Stable action identifier |
| `label` | text | Display label at time of action |
| `enqueued_job_id` | uuid FK nullable | Job created by action |
| `metadata` | jsonb | Optional context |
| `created_at` | timestamptz | Action time |

### `system_components`

Infrastructure health rows.

| Column | Type | Notes |
|--------|------|-------|
| `component_key` | text | e.g. `database`, `api_gateway` |
| `label` | text | Display name |
| `status` | text | `healthy`, `degraded`, `down` |
| `last_checked_at` | timestamptz | Last probe/update |
| `detail` | text | Optional status detail |

**Unique:** `(user_id, component_key)`

**Seed components:** Database, API Gateway, Runner Network, Storage, Auth Bridge.

## Derived system status

Computed in the app (not stored):

| Status | Condition |
|--------|-----------|
| `critical` | Any metric/component `critical` OR any open `critical` anomaly |
| `degraded` | Any metric/component warning/degraded OR pending jobs > threshold (default 5) |
| `nominal` | Otherwise |

## Migrations

| File | Purpose |
|------|---------|
| `0006_control_room_entities.sql` | DDL + RLS |
| `0007_control_room_grants.sql` | `GRANT` to `authenticated` |
| `0008_runner_claim_rpc.sql` | `claim_runner_job()` RPC |

## Future expansion (not MVP)

Add to `runner_jobs`:

```sql
recurring boolean default false,
next_run_at timestamptz
```

Enables self-generated activity without relying solely on seed/history.
