# Product lane — Flux Control Room

## What this is

**Flux Control Room** is a mobile-first, Flux-powered operational dashboard demo for a fictional facility named **Vessel Reactor One**. It demonstrates real Flux integration patterns — Postgres-backed state, RLS, migrations, server actions, job claiming, and a background runner — using simulated telemetry.

**Conceptual centerpiece:** *systemd keeps the process alive; Postgres keeps the work safe.*

**Subtitle (default):** Postgres-backed operations, simulated in real time.

## What this is not

- A nuclear reactor simulator or safety-critical system
- A real-time streaming platform (no WebSockets, no Kafka)
- A multi-tenant SaaS product (MVP = one facility per `user_id`)
- A charting showcase or cyberpunk dashboard toy

Use **operational telemetry** language. The facility fiction is playful; the architecture is real.

## Terminology

Avoid literal nuclear-simulator labels:

| Avoid | Use |
|-------|-----|
| Core Temperature | Thermal Load |
| Coolant Pressure | Loop Pressure |
| Neutron Flux | Signal Flux |
| Containment | Integrity |
| Emergency Cooldown | Controlled Reset |

Keep: **Reactor stability**, **Signal confidence**, **Queue depth**, **System load**, **Vessel Reactor One**.

## MVP scope

### Primary route

- **`/control-room`** — protected operational dashboard (single primary route)
- **`/`** — marketing landing + sign-in

### Dashboard sections

1. Header / status summary
2. Metrics (with compact sparklines)
3. Runner panel (with heartbeat age)
4. Event feed
5. Anomalies
6. Operator actions
7. System health

### Architecture (real)

- Postgres tables store metrics, events, jobs, heartbeats, anomalies, audit logs, components
- A runner process claims pending jobs via atomic RPC
- Claimed jobs write updates back through Flux
- The UI reads from Flux via RSC + server actions
- Manual operator actions enqueue jobs and write audit/signal events
- Stale leases can be reclaimed by another runner

### Reference scaffolding

Generic Foundry CRUD routes (`/records`, `/activity`, `/settings/profile`) remain **intentionally available** in the codebase and reachable by direct URL. They are hidden from the default nav so Control Room is the demo focus, but preserved as educational reference for developers exploring the repository.

## Non-goals (MVP)

- Real nuclear, financial, or safety-critical logic
- External services beyond Flux/Postgres/OAuth
- Heavy chart libraries (SVG/CSS sparklines only)
- Aggressive polling or WebSockets
- Authentication complexity beyond Foundry defaults
- Multi-facility or multi-operator roles
- Recurring/scheduled jobs (future expansion only)

## Refresh model

- RSC load on navigation
- Manual **Refresh** button (`router.refresh()`)
- `revalidatePath` after operator actions
- Optional auto-refresh ≥ 30s if added later — not required for MVP

## Related contracts

- `_contract/data-model.md` — schema
- `_contract/runner-pattern.md` — job claims and simulation cadence
- `_contract/ui-mobile-first.md` — layout and quiet UI
- `_contract/flux-integration.md` — HTTP boundary modules
