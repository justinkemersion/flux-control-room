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

  if not found then
    return;
  end if;

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

grant execute on function claim_runner_job(text, int) to authenticated;
