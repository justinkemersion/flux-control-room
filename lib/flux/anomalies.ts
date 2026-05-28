import { fluxJson } from "./client";
import type { AnomalyRow, AnomalySeverity, AnomalyStatus } from "./types";

export async function listAnomalies(
  sub: string,
  opts: { status?: AnomalyStatus[] } = {},
): Promise<AnomalyRow[]> {
  const params = new URLSearchParams({ order: "first_seen_at.desc" });
  if (opts.status?.length) {
    params.set("status", `in.(${opts.status.join(",")})`);
  }
  return fluxJson<AnomalyRow[]>(sub, `/anomalies?${params}`);
}

export async function createAnomaly(
  sub: string,
  payload: {
    title: string;
    severity: AnomalySeverity;
    status?: AnomalyStatus;
    metadata?: Record<string, unknown> | null;
  },
): Promise<AnomalyRow> {
  const rows = await fluxJson<AnomalyRow[]>(sub, "/anomalies", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      title: payload.title,
      severity: payload.severity,
      status: payload.status ?? "open",
      metadata: payload.metadata ?? null,
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("createAnomaly: empty response");
  return row;
}

export async function patchAnomaly(
  sub: string,
  id: string,
  payload: Partial<{ status: AnomalyStatus; resolved_at: string | null }>,
): Promise<AnomalyRow> {
  const rows = await fluxJson<AnomalyRow[]>(
    sub,
    `/anomalies?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  const row = rows[0];
  if (!row) throw new Error("patchAnomaly: empty response");
  return row;
}
