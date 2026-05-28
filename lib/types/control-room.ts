export type MetricStatus = "nominal" | "warning" | "critical";
export type SignalSeverity = "info" | "warn" | "error" | "critical";
export type JobStatus = "pending" | "claimed" | "completed" | "failed" | "expired";
export type RunnerStatus = "idle" | "busy" | "offline";
export type AnomalySeverity = "low" | "medium" | "high" | "critical";
export type AnomalyStatus = "open" | "acknowledged" | "resolved";
export type ComponentStatus = "healthy" | "degraded" | "down";
export type SystemStatus = "nominal" | "degraded" | "critical";

export type ControlMetricRow = {
  id: string;
  user_id: string;
  metric_key: string;
  label: string;
  unit: string;
  current_value: number;
  status: MetricStatus;
  updated_at: string;
};

export type MetricSampleRow = {
  id: string;
  metric_id: string;
  user_id: string;
  value: number;
  recorded_at: string;
};

export type SignalEventRow = {
  id: string;
  user_id: string;
  severity: SignalSeverity;
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type RunnerJobRow = {
  id: string;
  user_id: string;
  job_type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  lease_expires_at: string | null;
  attempt_count: number;
  last_error: string | null;
  completed_at: string | null;
  created_at: string;
};

export type RunnerHeartbeatRow = {
  id: string;
  user_id: string;
  runner_name: string;
  status: RunnerStatus;
  last_heartbeat_at: string;
  current_job_id: string | null;
  jobs_completed: number;
  metadata: Record<string, unknown> | null;
};

export type AnomalyRow = {
  id: string;
  user_id: string;
  title: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  first_seen_at: string;
  resolved_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type OperatorActionRow = {
  id: string;
  user_id: string;
  action_key: string;
  label: string;
  enqueued_job_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SystemComponentRow = {
  id: string;
  user_id: string;
  component_key: string;
  label: string;
  status: ComponentStatus;
  last_checked_at: string;
  detail: string | null;
};

export type OperatorActionKey =
  | "stabilize_core"
  | "flush_queue"
  | "rotate_signal"
  | "run_diagnostic"
  | "ack_anomalies"
  | "controlled_reset";

export const OPERATOR_ACTIONS: Record<
  OperatorActionKey,
  { label: string; jobType: string }
> = {
  stabilize_core: { label: "Stabilize Core", jobType: "update_metric" },
  flush_queue: { label: "Flush Queue", jobType: "flush_queue" },
  rotate_signal: { label: "Rotate Signal", jobType: "rotate_signal" },
  run_diagnostic: { label: "Run Diagnostic", jobType: "run_diagnostic" },
  ack_anomalies: { label: "Acknowledge Anomalies", jobType: "ack_anomalies" },
  controlled_reset: { label: "Controlled Reset", jobType: "controlled_reset" },
};
