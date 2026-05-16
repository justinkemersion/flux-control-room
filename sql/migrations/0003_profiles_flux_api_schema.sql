-- Replace {{FLUX_API_SCHEMA}} with your Flux API schema after `flux push`.
create schema if not exists {{FLUX_API_SCHEMA}};

create table if not exists {{FLUX_API_SCHEMA}}.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table {{FLUX_API_SCHEMA}}.profiles enable row level security;

create policy profiles_select on {{FLUX_API_SCHEMA}}.profiles for select to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

create policy profiles_insert on {{FLUX_API_SCHEMA}}.profiles for insert to authenticated with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

create policy profiles_update on {{FLUX_API_SCHEMA}}.profiles for update to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
) with check (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

create policy profiles_delete on {{FLUX_API_SCHEMA}}.profiles for delete to authenticated using (
  (current_setting('request.jwt.claims', true)::json->>'sub') = user_id
);

grant usage on schema {{FLUX_API_SCHEMA}} to authenticated;
grant select, insert, update, delete on table {{FLUX_API_SCHEMA}}.profiles to authenticated;
