import type {
  AnomalyRow,
  ControlMetricRow,
  RunnerHeartbeatRow,
  SignalEventRow,
  SystemComponentRow,
  SystemStatus,
} from "@/lib/types/control-room";

const PENDING_JOBS_DEGRADED_THRESHOLD = 5;

export function deriveSystemStatus(input: {
  metrics: ControlMetricRow[];
  components: SystemComponentRow[];
  anomalies: AnomalyRow[];
  pendingJobs: number;
}): SystemStatus {
  const hasCriticalMetric = input.metrics.some((m) => m.status === "critical");
  const hasCriticalComponent = input.components.some((c) => c.status === "down");
  const hasCriticalAnomaly = input.anomalies.some(
    (a) => a.status !== "resolved" && a.severity === "critical",
  );
  if (hasCriticalMetric || hasCriticalComponent || hasCriticalAnomaly) {
    return "critical";
  }

  const hasWarningMetric = input.metrics.some((m) => m.status === "warning");
  const hasDegradedComponent = input.components.some((c) => c.status === "degraded");
  const hasOpenAnomaly = input.anomalies.some((a) => a.status === "open");
  if (
    hasWarningMetric ||
    hasDegradedComponent ||
    hasOpenAnomaly ||
    input.pendingJobs > PENDING_JOBS_DEGRADED_THRESHOLD
  ) {
    return "degraded";
  }

  return "nominal";
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function heartbeatAgeSeconds(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
}

export function isHeartbeatStale(iso: string, thresholdSeconds = 30): boolean {
  return heartbeatAgeSeconds(iso) > thresholdSeconds;
}

export function countActiveRunners(heartbeats: RunnerHeartbeatRow[]): number {
  return heartbeats.filter((h) => !isHeartbeatStale(h.last_heartbeat_at)).length;
}

export function lastSignalTimestamp(events: SignalEventRow[]): string | null {
  return events[0]?.created_at ?? null;
}

export function facilityUptimeLabel(seedTime?: string): string {
  if (!seedTime) return "—";
  const hours = Math.floor((Date.now() - new Date(seedTime).getTime()) / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
