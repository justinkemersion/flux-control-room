# Write SQL migration

1. Follow `_contract/database.md`.
2. Use RLS invariant on every policy.
3. Add separate `*_grants.sql` and `*_flux_api_schema.sql` files.
4. Replace `{{FLUX_API_SCHEMA}}` after `flux push`.
5. Extend `migration.rls.test.ts` for new files.
