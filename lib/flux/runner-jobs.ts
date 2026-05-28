import { fluxJson } from "./client";
import type { JobStatus, RunnerJobRow } from "./types";

export async function listJobs(
  sub: string,
  opts: { status?: JobStatus; limit?: number } = {},
): Promise<RunnerJobRow[]> {
  const params = new URLSearchParams({ order: "created_at.desc" });
  if (opts.status) params.set("status", `eq.${opts.status}`);
  if (opts.limit) params.set("limit", String(opts.limit));
  return fluxJson<RunnerJobRow[]>(sub, `/runner_jobs?${params}`);
}

export async function countPendingJobs(sub: string): Promise<number> {
  const rows = await listJobs(sub, { status: "pending", limit: 1000 });
  return rows.length;
}

export async function createJob(
  sub: string,
  payload: {
    job_type: string;
    payload?: Record<string, unknown>;
  },
): Promise<RunnerJobRow> {
  const rows = await fluxJson<RunnerJobRow[]>(sub, "/runner_jobs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      job_type: payload.job_type,
      payload: payload.payload ?? {},
      status: "pending",
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("createJob: empty response");
  return row;
}

export async function claimJob(
  sub: string,
  runnerName: string,
  leaseSeconds = 60,
): Promise<RunnerJobRow | null> {
  const rows = await fluxJson<RunnerJobRow[]>(sub, "/rpc/claim_runner_job", {
    method: "POST",
    body: JSON.stringify({
      p_runner_name: runnerName,
      p_lease_seconds: leaseSeconds,
    }),
  });
  return rows[0] ?? null;
}

export async function completeJob(sub: string, id: string): Promise<RunnerJobRow> {
  const rows = await fluxJson<RunnerJobRow[]>(
    sub,
    `/runner_jobs?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
      }),
    },
  );
  const row = rows[0];
  if (!row) throw new Error("completeJob: empty response");
  return row;
}

export async function failJob(
  sub: string,
  id: string,
  lastError: string,
): Promise<RunnerJobRow> {
  const rows = await fluxJson<RunnerJobRow[]>(
    sub,
    `/runner_jobs?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "failed",
        last_error: lastError,
        completed_at: new Date().toISOString(),
      }),
    },
  );
  const row = rows[0];
  if (!row) throw new Error("failJob: empty response");
  return row;
}
