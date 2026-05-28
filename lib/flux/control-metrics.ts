import { fluxJson } from "./client";
import type { ControlMetricRow, MetricSampleRow, MetricStatus } from "./types";

export async function listMetrics(sub: string): Promise<ControlMetricRow[]> {
  return fluxJson<ControlMetricRow[]>(sub, "/control_metrics?order=metric_key.asc");
}

export async function getMetricByKey(
  sub: string,
  metricKey: string,
): Promise<ControlMetricRow | null> {
  const rows = await fluxJson<ControlMetricRow[]>(
    sub,
    `/control_metrics?metric_key=eq.${encodeURIComponent(metricKey)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function upsertMetric(
  sub: string,
  payload: {
    metric_key: string;
    label: string;
    unit: string;
    current_value: number;
    status?: MetricStatus;
  },
): Promise<ControlMetricRow> {
  const existing = await getMetricByKey(sub, payload.metric_key);
  if (existing) {
    const rows = await fluxJson<ControlMetricRow[]>(
      sub,
      `/control_metrics?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          label: payload.label,
          unit: payload.unit,
          current_value: payload.current_value,
          status: payload.status ?? existing.status,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    const row = rows[0];
    if (!row) throw new Error("upsertMetric: empty patch response");
    return row;
  }

  const rows = await fluxJson<ControlMetricRow[]>(sub, "/control_metrics", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      metric_key: payload.metric_key,
      label: payload.label,
      unit: payload.unit,
      current_value: payload.current_value,
      status: payload.status ?? "nominal",
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("upsertMetric: empty post response");
  return row;
}

export async function patchMetric(
  sub: string,
  id: string,
  payload: Partial<{
    current_value: number;
    status: MetricStatus;
  }>,
): Promise<ControlMetricRow> {
  const rows = await fluxJson<ControlMetricRow[]>(
    sub,
    `/control_metrics?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
    },
  );
  const row = rows[0];
  if (!row) throw new Error("patchMetric: empty response");
  return row;
}

export async function listSamples(
  sub: string,
  metricId: string,
  limit = 24,
): Promise<MetricSampleRow[]> {
  return fluxJson<MetricSampleRow[]>(
    sub,
    `/metric_samples?metric_id=eq.${encodeURIComponent(metricId)}&order=recorded_at.desc&limit=${limit}`,
  );
}

export async function insertSample(
  sub: string,
  payload: { metric_id: string; value: number; recorded_at?: string },
): Promise<MetricSampleRow> {
  const rows = await fluxJson<MetricSampleRow[]>(sub, "/metric_samples", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      metric_id: payload.metric_id,
      value: payload.value,
      recorded_at: payload.recorded_at ?? new Date().toISOString(),
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("insertSample: empty response");
  return row;
}
