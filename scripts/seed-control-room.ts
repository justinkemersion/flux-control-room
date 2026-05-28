/**
 * Seed nominal Control Room state for CONTROL_ROOM_USER_SUB (or DEMO_USER_SUB).
 * Requires FLUX_URL, FLUX_GATEWAY_JWT_SECRET, and user sub in env.
 */
import { upsertMetric, insertSample } from "../lib/flux/control-metrics";
import { createEvent } from "../lib/flux/signal-events";
import { upsertHeartbeat } from "../lib/flux/runner-heartbeats";
import { upsertComponent } from "../lib/flux/system-components";
import { createAnomaly } from "../lib/flux/anomalies";
import { loadEnvFiles } from "./lib/load-env";
import {
  CONTROL_ROOM_SUB_HINT,
  resolveControlRoomSub,
} from "./lib/resolve-control-room-sub";

const METRICS = [
  { metric_key: "reactor_stability", label: "Reactor stability", unit: "index", value: 94.2 },
  { metric_key: "thermal_load", label: "Thermal Load", unit: "°C", value: 318.5 },
  { metric_key: "loop_pressure", label: "Loop Pressure", unit: "kPa", value: 142.0 },
  { metric_key: "signal_confidence", label: "Signal confidence", unit: "%", value: 97.1 },
  { metric_key: "queue_depth", label: "Queue depth", unit: "count", value: 2 },
  { metric_key: "system_load", label: "System load", unit: "%", value: 38.0 },
  { metric_key: "db_pool_utilization", label: "Database pool utilization", unit: "%", value: 41.0 },
  { metric_key: "gateway_latency", label: "Gateway latency", unit: "ms", value: 12.0 },
] as const;

const COMPONENTS = [
  { component_key: "database", label: "Database" },
  { component_key: "api_gateway", label: "API Gateway" },
  { component_key: "runner_network", label: "Runner Network" },
  { component_key: "storage", label: "Storage" },
  { component_key: "auth_bridge", label: "Auth Bridge" },
] as const;

function seededValue(base: number, index: number): number {
  const drift = Math.sin(index / 3) * (base * 0.02);
  return Math.round((base + drift) * 10) / 10;
}

async function main() {
  loadEnvFiles();
  const sub = resolveControlRoomSub();
  if (!sub) {
    console.error(CONTROL_ROOM_SUB_HINT);
    process.exit(1);
  }

  for (const def of COMPONENTS) {
    await upsertComponent(sub, {
      component_key: def.component_key,
      label: def.label,
      status: "healthy",
      detail: "Nominal",
    });
  }

  for (const def of METRICS) {
    const metric = await upsertMetric(sub, {
      metric_key: def.metric_key,
      label: def.label,
      unit: def.unit,
      current_value: def.value,
      status: "nominal",
    });

    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const recordedAt = new Date(now - i * 5 * 60_000).toISOString();
      await insertSample(sub, {
        metric_id: metric.id,
        value: seededValue(def.value, i),
        recorded_at: recordedAt,
      });
    }
  }

  for (const name of ["runner-01", "runner-02", "runner-03"]) {
    await upsertHeartbeat(sub, {
      runner_name: name,
      status: "idle",
      jobs_completed: name === "runner-01" ? 12 : name === "runner-02" ? 8 : 5,
    });
  }

  const events = [
    { severity: "info" as const, source: "system", message: "Facility telemetry baseline established" },
    { severity: "info" as const, source: "runner-01", message: "Runner network synchronized" },
    { severity: "info" as const, source: "system", message: "Loop pressure within expected band" },
    { severity: "info" as const, source: "system", message: "Signal confidence stable at 97%" },
    { severity: "warn" as const, source: "system", message: "Queue depth briefly elevated — cleared" },
    { severity: "info" as const, source: "runner-02", message: "Diagnostic sweep completed — no faults" },
    { severity: "info" as const, source: "system", message: "Gateway latency nominal" },
    { severity: "info" as const, source: "system", message: "Database pool utilization steady" },
    { severity: "info" as const, source: "runner-03", message: "Heartbeat channel verified" },
    { severity: "info" as const, source: "system", message: "Thermal load trending flat" },
    { severity: "info" as const, source: "system", message: "Auth bridge token validity confirmed" },
    { severity: "info" as const, source: "system", message: "All components reporting healthy" },
  ];

  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    await createEvent(sub, {
      ...e,
      metadata: { seeded: true, index: i },
    });
  }

  await createAnomaly(sub, {
    title: "Minor signal drift on auxiliary channel",
    severity: "low",
    status: "open",
    metadata: { channel: "aux-2" },
  });

  console.log("Seeded Control Room data for", sub);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
