-- v2_shared: gateway bridges app JWT to t_<12hex>_role (not authenticated).
-- Per-table GRANT TO authenticated is required for v1; pooled tenants also need DML on the tenant role.
-- Derives role from search_path (flux push sets search_path to the tenant api schema).
DO $flux$
DECLARE
  api_schema text := current_schema();
  tenant_role text;
BEGIN
  IF api_schema !~ '^t_[0-9a-f]{12}_api$' THEN
    -- v1_dedicated / legacy: authenticated grants in *_grants.sql are sufficient.
    RETURN;
  END IF;

  tenant_role := regexp_replace(api_schema, '_api$', '_role');

  EXECUTE format(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I',
    api_schema,
    tenant_role
  );
  EXECUTE format(
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO %I',
    api_schema,
    tenant_role
  );
  EXECUTE format(
    'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO %I',
    api_schema,
    tenant_role
  );
END
$flux$;
