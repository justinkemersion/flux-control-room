#!/usr/bin/env tsx
/**
 * Control Room background runner — claims jobs, updates metrics, emits events.
 * Requires FLUX_URL, FLUX_GATEWAY_JWT_SECRET, CONTROL_ROOM_USER_SUB (or DEMO_USER_SUB).
 */
import { getMetricByKey, insertSample, patchMetric } from "../../lib/flux/control-metrics";
import { createEvent } from "../../lib/flux/signal-events";
import {
  claimJob,
  completeJob,
  createJob,
  failJob,
} from "../../lib/flux/runner-jobs";
import { upsertHeartbeat, getHeartbeat } from "../../lib/flux/runner-heartbeats";
import { listAnomalies, patchAnomaly } from "../../lib/flux/anomalies";
import { listComponents, patchComponent } from "../../lib/flux/system-components";
import { loadEnvFiles } from "../lib/load-env";
import {
  CONTROL_ROOM_SUB_HINT,
  resolveControlRoomSub,
} from "../lib/resolve-control-room-sub";

function runnerName(): string {
  return process.env.RUNNER_NAME?.trim() || "runner-01";
}

function leaseSeconds(): number {
  return Number(process.env.RUNNER_LEASE_SECONDS ?? 60);
}

function pollMs(): number {
  return Number(process.env.RUNNER_POLL_MS ?? 5000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function boundedDelta(base: number, maxDelta: number): number {
  const delta = (Math.random() - 0.5) * 2 * maxDelta;
  return Math.round((base + delta) * 10) / 10;
}

async function writeMetric(
  sub: string,
  metricKey: string,
  nextValue: number,
  source: string,
  message: string,
): Promise<void> {
  const metric = await getMetricByKey(sub, metricKey);
  if (!metric) return;
  await patchMetric(sub, metric.id, { current_value: nextValue });
  await insertSample(sub, { metric_id: metric.id, value: nextValue });
  await createEvent(sub, {
    severity: "info",
    source,
    message,
    metadata: { metric_key: metricKey, value: nextValue },
  });
}

async function processJob(
  sub: string,
  name: string,
  job: { id: string; job_type: string; payload: Record<string, unknown> },
): Promise<void> {
  await upsertHeartbeat(sub, {
    runner_name: name,
    status: "busy",
    current_job_id: job.id,
  });

  switch (job.job_type) {
    case "update_metric": {
      const metric = await getMetricByKey(sub, "reactor_stability");
      if (metric) {
        const next = Math.min(100, metric.current_value + 1.5);
        await writeMetric(sub, "reactor_stability", next, name, "Reactor stability nudged upward");
      }
      break;
    }
    case "flush_queue": {
      const metric = await getMetricByKey(sub, "queue_depth");
      if (metric) {
        const next = Math.max(0, metric.current_value - 1);
        await writeMetric(sub, "queue_depth", next, name, "Queue depth reduced");
      }
      break;
    }
    case "rotate_signal": {
      const metric = await getMetricByKey(sub, "signal_confidence");
      if (metric) {
        const next = Math.min(100, metric.current_value + 0.8);
        await writeMetric(sub, "signal_confidence", next, name, "Signal confidence rotated");
      }
      break;
    }
    case "run_diagnostic": {
      const components = await listComponents(sub);
      for (const component of components) {
        await patchComponent(sub, component.id, {
          status: "healthy",
          detail: "Diagnostic OK",
        });
      }
      await createEvent(sub, {
        severity: "info",
        source: name,
        message: "Diagnostic sweep completed",
      });
      break;
    }
    case "ack_anomalies": {
      const anomalies = await listAnomalies(sub, { status: ["open"] });
      for (const anomaly of anomalies) {
        await patchAnomaly(sub, anomaly.id, { status: "acknowledged" });
      }
      await createEvent(sub, {
        severity: "info",
        source: name,
        message: "Open anomalies acknowledged",
      });
      break;
    }
    case "controlled_reset": {
      const metric = await getMetricByKey(sub, "thermal_load");
      if (metric) {
        const next = Math.max(280, metric.current_value - 8);
        await patchMetric(sub, metric.id, { current_value: next, status: "warning" });
        await insertSample(sub, { metric_id: metric.id, value: next });
      }
      await createEvent(sub, {
        severity: "warn",
        source: name,
        message: "Controlled reset applied — thermal load reduced",
      });
      break;
    }
    case "simulate_drift": {
      const keys = ["system_load", "gateway_latency", "db_pool_utilization"] as const;
      const key = keys[Math.floor(Math.random() * keys.length)]!;
      const metric = await getMetricByKey(sub, key);
      if (metric) {
        const maxDelta = key === "gateway_latency" ? 2 : 1.5;
        const next = boundedDelta(metric.current_value, maxDelta);
        await patchMetric(sub, metric.id, { current_value: next });
        await insertSample(sub, { metric_id: metric.id, value: next });
      }
      break;
    }
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

let lastDriftAt = 0;

async function maybeEnqueueDrift(sub: string): Promise<void> {
  const now = Date.now();
  if (now - lastDriftAt < 120_000) return;
  if (Math.random() > 0.35) return;
  lastDriftAt = now;
  await createJob(sub, { job_type: "simulate_drift", payload: { source: "cadence" } });
}

async function runOnce(sub: string, name: string): Promise<boolean> {
  await upsertHeartbeat(sub, { runner_name: name, status: "idle", current_job_id: null });
  await maybeEnqueueDrift(sub);

  const job = await claimJob(sub, name, leaseSeconds());
  if (!job) return false;

  try {
    await processJob(sub, name, job);
    await completeJob(sub, job.id);
    const hb = await getHeartbeat(sub, name);
    await upsertHeartbeat(sub, {
      runner_name: name,
      status: "idle",
      current_job_id: null,
      jobs_completed: (hb?.jobs_completed ?? 0) + 1,
    });
    await createEvent(sub, {
      severity: "info",
      source: name,
      message: `Job ${job.job_type} completed`,
      metadata: { job_id: job.id },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Job failed";
    await failJob(sub, job.id, message);
    await upsertHeartbeat(sub, {
      runner_name: name,
      status: "idle",
      current_job_id: null,
    });
    await createEvent(sub, {
      severity: "error",
      source: name,
      message,
      metadata: { job_id: job.id },
    });
  }

  return true;
}

async function main() {
  loadEnvFiles();
  const sub = resolveControlRoomSub();
  if (!sub) {
    console.error(CONTROL_ROOM_SUB_HINT);
    process.exit(1);
  }

  const name = runnerName();
  const once = process.argv.includes("--once");

  console.log(`Control Room runner ${name} starting (${once ? "once" : "loop"})`);

  if (once) {
    const worked = await runOnce(sub, name);
    console.log(worked ? "Processed a job" : "No job available");
    return;
  }

  while (true) {
    await runOnce(sub, name);
    await sleep(pollMs());
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
