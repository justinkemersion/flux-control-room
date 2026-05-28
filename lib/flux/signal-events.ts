import { fluxJson } from "./client";
import type { SignalEventRow, SignalSeverity } from "./types";

export async function listEvents(sub: string, limit = 50): Promise<SignalEventRow[]> {
  return fluxJson<SignalEventRow[]>(
    sub,
    `/signal_events?order=created_at.desc&limit=${limit}`,
  );
}

export async function createEvent(
  sub: string,
  payload: {
    severity: SignalSeverity;
    source: string;
    message: string;
    metadata?: Record<string, unknown> | null;
  },
): Promise<SignalEventRow> {
  const rows = await fluxJson<SignalEventRow[]>(sub, "/signal_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      severity: payload.severity,
      source: payload.source,
      message: payload.message,
      metadata: payload.metadata ?? null,
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("createEvent: empty response");
  return row;
}
