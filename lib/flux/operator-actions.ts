import { fluxJson } from "./client";
import type { OperatorActionRow } from "./types";

export async function listOperatorActions(
  sub: string,
  limit = 20,
): Promise<OperatorActionRow[]> {
  return fluxJson<OperatorActionRow[]>(
    sub,
    `/operator_actions?order=created_at.desc&limit=${limit}`,
  );
}

export async function createOperatorAction(
  sub: string,
  payload: {
    action_key: string;
    label: string;
    enqueued_job_id?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<OperatorActionRow> {
  const rows = await fluxJson<OperatorActionRow[]>(sub, "/operator_actions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      action_key: payload.action_key,
      label: payload.label,
      enqueued_job_id: payload.enqueued_job_id ?? null,
      metadata: payload.metadata ?? null,
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("createOperatorAction: empty response");
  return row;
}
