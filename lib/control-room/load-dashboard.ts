import { listMetrics, listSamples } from "@/lib/flux/control-metrics";
import { listEvents } from "@/lib/flux/signal-events";
import { countPendingJobs, listJobs } from "@/lib/flux/runner-jobs";
import { listHeartbeats } from "@/lib/flux/runner-heartbeats";
import { listAnomalies } from "@/lib/flux/anomalies";
import { listComponents } from "@/lib/flux/system-components";
import {
  countActiveRunners,
  deriveSystemStatus,
  lastSignalTimestamp,
} from "@/lib/control-room/system-status";
import type {
  AnomalyRow,
  ControlMetricRow,
  MetricSampleRow,
  RunnerHeartbeatRow,
  RunnerJobRow,
  SignalEventRow,
  SystemComponentRow,
  SystemStatus,
} from "@/lib/types/control-room";

export type ControlRoomDashboardData = {
  metrics: ControlMetricRow[];
  samplesByMetricId: Record<string, MetricSampleRow[]>;
  events: SignalEventRow[];
  heartbeats: RunnerHeartbeatRow[];
  claimedJobs: RunnerJobRow[];
  anomalies: AnomalyRow[];
  components: SystemComponentRow[];
  pendingJobs: number;
  activeRunners: number;
  systemStatus: SystemStatus;
  lastSignal: string | null;
};

export async function loadControlRoomDashboard(
  sub: string,
): Promise<ControlRoomDashboardData> {
  const [metrics, events, heartbeats, anomalies, components, pendingJobs, claimedJobs] =
    await Promise.all([
      listMetrics(sub),
      listEvents(sub, 50),
      listHeartbeats(sub),
      listAnomalies(sub, { status: ["open", "acknowledged"] }),
      listComponents(sub),
      countPendingJobs(sub),
      listJobs(sub, { status: "claimed", limit: 20 }),
    ]);

  const samplesEntries = await Promise.all(
    metrics.map(async (metric) => {
      const samples = await listSamples(sub, metric.id, 24);
      return [metric.id, samples] as const;
    }),
  );

  const openAnomalies = anomalies.filter((a) => a.status !== "resolved");

  return {
    metrics,
    samplesByMetricId: Object.fromEntries(samplesEntries),
    events,
    heartbeats,
    claimedJobs,
    anomalies: openAnomalies,
    components,
    pendingJobs,
    activeRunners: countActiveRunners(heartbeats),
    systemStatus: deriveSystemStatus({
      metrics,
      components,
      anomalies: openAnomalies,
      pendingJobs,
    }),
    lastSignal: lastSignalTimestamp(events),
  };
}
