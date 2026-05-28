create table if not exists control_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  metric_key text not null,
  label text not null,
  unit text not null default '',
  current_value numeric not null default 0,
  status text not null default 'nominal' check (status in ('nominal', 'warning', 'critical')),
  updated_at timestamptz not null default now(),
  unique (user_id, metric_key)
);

create index if not exists control_metrics_user_key_idx on control_metrics (user_id, metric_key);

create table if not exists metric_samples (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references control_metrics (id) on delete cascade,
  user_id text not null,
  value numeric not null,
  recorded_at timestamptz not null default now()
);

create index if not exists metric_samples_metric_recorded_idx
  on metric_samples (metric_id, recorded_at desc);
create index if not exists metric_samples_user_recorded_idx
  on metric_samples (user_id, recorded_at desc);

create table if not exists signal_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  severity text not null check (severity in ('info', 'warn', 'error', 'critical')),
  source text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists signal_events_user_created_idx
  on signal_events (user_id, created_at desc);

create table if not exists runner_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  job_type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'completed', 'failed', 'expired')),
  claimed_by text,
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  attempt_count int not null default 0,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists runner_jobs_user_status_lease_idx
  on runner_jobs (user_id, status, lease_expires_at);
create index if not exists runner_jobs_user_created_idx
  on runner_jobs (user_id, created_at asc);

create table if not exists runner_heartbeats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  runner_name text not null,
  status text not null default 'idle' check (status in ('idle', 'busy', 'offline')),
  last_heartbeat_at timestamptz not null default now(),
  current_job_id uuid references runner_jobs (id) on delete set null,
  jobs_completed int not null default 0,
  metadata jsonb,
  unique (user_id, runner_name)
);

create index if not exists runner_heartbeats_user_name_idx
  on runner_heartbeats (user_id, runner_name);

create table if not exists anomalies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved')),
  first_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb
);

create index if not exists anomalies_user_status_idx
  on anomalies (user_id, status, first_seen_at desc);

create table if not exists operator_actions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action_key text not null,
  label text not null,
  enqueued_job_id uuid references runner_jobs (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operator_actions_user_created_idx
  on operator_actions (user_id, created_at desc);

create table if not exists system_components (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  component_key text not null,
  label text not null,
  status text not null default 'healthy'
    check (status in ('healthy', 'degraded', 'down')),
  last_checked_at timestamptz not null default now(),
  detail text,
  unique (user_id, component_key)
);

create index if not exists system_components_user_key_idx
  on system_components (user_id, component_key);

alter table control_metrics enable row level security;
alter table metric_samples enable row level security;
alter table signal_events enable row level security;
alter table runner_jobs enable row level security;
alter table runner_heartbeats enable row level security;
alter table anomalies enable row level security;
alter table operator_actions enable row level security;
alter table system_components enable row level security;

-- control_metrics
create policy control_metrics_select on control_metrics for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy control_metrics_insert on control_metrics for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy control_metrics_update on control_metrics for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy control_metrics_delete on control_metrics for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- metric_samples
create policy metric_samples_select on metric_samples for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy metric_samples_insert on metric_samples for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy metric_samples_update on metric_samples for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy metric_samples_delete on metric_samples for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- signal_events
create policy signal_events_select on signal_events for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy signal_events_insert on signal_events for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy signal_events_update on signal_events for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy signal_events_delete on signal_events for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- runner_jobs
create policy runner_jobs_select on runner_jobs for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_jobs_insert on runner_jobs for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_jobs_update on runner_jobs for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_jobs_delete on runner_jobs for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- runner_heartbeats
create policy runner_heartbeats_select on runner_heartbeats for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_heartbeats_insert on runner_heartbeats for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_heartbeats_update on runner_heartbeats for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy runner_heartbeats_delete on runner_heartbeats for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- anomalies
create policy anomalies_select on anomalies for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy anomalies_insert on anomalies for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy anomalies_update on anomalies for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy anomalies_delete on anomalies for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- operator_actions
create policy operator_actions_select on operator_actions for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy operator_actions_insert on operator_actions for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy operator_actions_update on operator_actions for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy operator_actions_delete on operator_actions for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

-- system_components
create policy system_components_select on system_components for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy system_components_insert on system_components for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy system_components_update on system_components for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
create policy system_components_delete on system_components for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);
