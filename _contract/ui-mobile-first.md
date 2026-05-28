# UI — mobile-first control room

## Design intent

Flux Control Room should look like a **serious industrial control surface**: dark, quiet, realistic, data-dense. Not cartoonish, not cyberpunk, not overly neon.

This is a fork deviation from Foundry's default light theme — documented in `FOUNDRY_BASELINE.md`.

## Quiet operational UI philosophy

The dashboard prioritizes **operational calm** — calm until something matters.

- Most states appear **nominal** most of the time
- Warnings create contrast through **rarity**, not volume
- Critical states are **temporary** and visually distinct
- Animation is **subtle and sparse** (status transitions only; no pulsing widgets)
- Dense data, quiet surfaces — realistic operations software, not a toy dashboard generator

## Visual tokens

Extend `app/globals.css` (Phase 3):

```css
:root {
  --background: #0f1114;
  --surface: #161a1f;
  --foreground: #e8eaed;
  --muted: #2a3038;
  --muted-fg: #8b929a;
  --border: #2a3038;
  --accent: #3d8c5c;
  --accent-fg: #e8eaed;
  --status-nominal: #3d8c5c;
  --status-warning: #b8923a;
  --status-critical: #a84848;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

### Status colors

| State | Color | Usage |
|-------|-------|-------|
| Nominal | Quiet green (`--status-nominal`) | Healthy metrics, system OK |
| Warning | Muted amber (`--status-warning`) | Degraded, stale runner |
| Critical | Controlled red (`--status-critical`) | Failures only — use sparingly |

### Typography

- Small labels: `text-xs uppercase tracking-wide text-[var(--muted-fg)]`
- Metric values: `font-mono text-lg` or `text-xl`
- Timestamps in feeds: `font-mono text-xs`
- Page title: `text-lg font-medium`

### Surfaces

- Thin borders: `border border-[var(--border)]`
- Cards on `--surface` over `--background`
- No glassmorphism, no glow, no gradient backgrounds

## Mobile-first layout

**Breakpoint:** design for 390px first; expand at `md:` (768px).

### Section order (mobile, single column)

1. **StatusSummary** — app name, Vessel Reactor One, system status pill, uptime, active runners, pending jobs, last signal timestamp
2. **MetricsGrid** — 6 primary metric cards + sparklines
3. **RunnerPanel** — stacked cards with heartbeat age (`8s ago`; `stale` badge if > 30s)
4. **EventFeed** — scrollable list, monospace timestamps
5. **AnomaliesPanel** — open anomalies
6. **OperatorActions** — 2-column thumb-friendly button grid
7. **SystemHealth** — component status rows

### Desktop (`md:`)

| Area | Layout |
|------|--------|
| Status summary | Full width |
| Metrics | 3×2 grid |
| Runners + System health | 2 columns |
| Events + Anomalies | 2 columns side-by-side |
| Operator actions | Single row of compact buttons |

## Component map

Place under `components/control-room/` (split per `anti-drift.md` LOC limits):

| Component | Responsibility |
|-----------|----------------|
| `StatusSummary.tsx` | Header strip + derived system status |
| `MetricsGrid.tsx` | Metric cards + sparklines |
| `MetricSparkline.tsx` | Simple SVG/CSS sparkline |
| `RunnerPanel.tsx` | Runner cards + heartbeat age |
| `EventFeed.tsx` | Signal events list |
| `AnomaliesPanel.tsx` | Anomaly list |
| `OperatorActions.tsx` | Action buttons (client → server actions) |
| `SystemHealth.tsx` | Component status rows |
| `RefreshControl.tsx` | Manual refresh button |

Pages compose these; no 200-line inline div trees.

## Shell navigation

- Primary nav item: **Control Room** → `/control-room`
- Hide Records, Activity, Settings from default nav
- Generic Foundry CRUD routes remain reachable by direct URL as reference scaffolding
- Mobile: collapse sidebar into top nav / hamburger; status summary above fold

## Sparklines

- Simple SVG polyline or CSS-only — no chart library for MVP
- ~24 samples from `metric_samples`
- Quiet stroke color; no animation on draw

## Refresh

- RSC on navigation
- **Refresh** button → `router.refresh()`
- No WebSockets
- Auto-refresh optional later (≥ 30s minimum)

## Loading / empty / error

- Loading: skeleton cards matching section layout
- Empty seed: calm message + link to seed docs
- Flux unavailable: muted error banner (match dashboard page try/catch pattern)

## Avoid

- Cartoon reactor art
- Sci-fi neon overload
- Fake hacker aesthetics
- Excessive animation
- Glassmorphism
- Childish dashboard widgets

## Related

- `_contract/design.md` — Foundry base design contract (composition rules)
- `_contract/component-rules.md` — LOC limits and client boundaries
