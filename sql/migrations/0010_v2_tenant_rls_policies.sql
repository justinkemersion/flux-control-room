-- v2_shared: RLS policies in Foundry migrations use TO authenticated, but PostgREST
-- sessions run as t_<12hex>_role after gateway bridge. Recreate policies for tenant role.
DO $flux$
DECLARE
  api_schema text := current_schema();
  tenant_role text;
  tbl text;
  op text;
  pol_name text;
  invariant constant text :=
    '(current_setting(''request.jwt.claims'', true)::json->>''sub'') = user_id';
BEGIN
  IF api_schema !~ '^t_[0-9a-f]{12}_api$' THEN
    RETURN;
  END IF;

  tenant_role := regexp_replace(api_schema, '_api$', '_role');

  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'records',
    'record_tags',
    'notes',
    'activity_events',
    'control_metrics',
    'metric_samples',
    'signal_events',
    'runner_jobs',
    'runner_heartbeats',
    'anomalies',
    'operator_actions',
    'system_components'
  ] LOOP
    FOREACH op IN ARRAY ARRAY['select', 'insert', 'update', 'delete'] LOOP
      pol_name := tbl || '_' || op;
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, tbl);

      IF op = 'select' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I FOR SELECT TO %I USING (%s)',
          pol_name,
          tbl,
          tenant_role,
          invariant
        );
      ELSIF op = 'insert' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I FOR INSERT TO %I WITH CHECK (%s)',
          pol_name,
          tbl,
          tenant_role,
          invariant
        );
      ELSIF op = 'update' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I FOR UPDATE TO %I USING (%s) WITH CHECK (%s)',
          pol_name,
          tbl,
          tenant_role,
          invariant,
          invariant
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON %I FOR DELETE TO %I USING (%s)',
          pol_name,
          tbl,
          tenant_role,
          invariant
        );
      END IF;
    END LOOP;
  END LOOP;
END
$flux$;
