import { fluxJson } from "./client";
import type { RunnerHeartbeatRow, RunnerStatus } from "./types";

export async function listHeartbeats(sub: string): Promise<RunnerHeartbeatRow[]> {
  return fluxJson<RunnerHeartbeatRow[]>(
    sub,
    "/runner_heartbeats?order=runner_name.asc",
  );
}

export async function getHeartbeat(
  sub: string,
  runnerName: string,
): Promise<RunnerHeartbeatRow | null> {
  const rows = await fluxJson<RunnerHeartbeatRow[]>(
    sub,
    `/runner_heartbeats?runner_name=eq.${encodeURIComponent(runnerName)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function upsertHeartbeat(
  sub: string,
  payload: {
    runner_name: string;
    status?: RunnerStatus;
    current_job_id?: string | null;
    jobs_completed?: number;
  },
): Promise<RunnerHeartbeatRow> {
  const existing = await getHeartbeat(sub, payload.runner_name);
  const body = {
    status: payload.status ?? "idle",
    last_heartbeat_at: new Date().toISOString(),
    current_job_id: payload.current_job_id ?? null,
    ...(payload.jobs_completed !== undefined
      ? { jobs_completed: payload.jobs_completed }
      : {}),
  };

  if (existing) {
    const rows = await fluxJson<RunnerHeartbeatRow[]>(
      sub,
      `/runner_heartbeats?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(body),
      },
    );
    const row = rows[0];
    if (!row) throw new Error("upsertHeartbeat: empty patch response");
    return row;
  }

  const rows = await fluxJson<RunnerHeartbeatRow[]>(sub, "/runner_heartbeats", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      runner_name: payload.runner_name,
      jobs_completed: payload.jobs_completed ?? 0,
      ...body,
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("upsertHeartbeat: empty post response");
  return row;
}
