# Foundry Baseline

Fork of `flux-app-foundry` for the **Flux Control Room** showcase app.

| Field | Value |
|-------|--------|
| Based on | `flux-app-foundry` |
| Baseline commit | `84ae115e91f1e9208c33927ce257263a3e1c1de3` |
| Last synced | 2026-05-27 (initial fork) |

## Blessed stack (maintain in dependency policy)

- Next.js App Router + React + TypeScript (strict)
- Tailwind CSS v4
- Auth.js v5 + `jose`
- Flux via PostgREST (`lib/flux/` boundary)
- Vitest + ESLint + Prettier

## Local deviations

| Deviation | Reason |
|-----------|--------|
| Dark operational UI tokens | Industrial control-room aesthetic (`ui-mobile-first.md`) |
| Domain contracts (`product-lane`, `data-model`, `runner-pattern`, `ui-mobile-first`, `flux-integration`) | Control Room showcase scope |
| Runner scripts (planned Phase 5) | Job-claiming demo pattern |
| Primary route `/control-room` | Mobile-first operational dashboard |
| Generic Foundry CRUD hidden from nav | Control Room is demo focus; routes kept as reference scaffolding |

Forks should update baseline commit and last synced date when merging upstream.
