import { Card } from "@/components/ui/Card";
import {
  formatRelativeTime,
  isHeartbeatStale,
} from "@/lib/control-room/system-status";
import type { RunnerHeartbeatRow, RunnerJobRow } from "@/lib/types/control-room";
import { cn } from "@/lib/ui/cn";

export function RunnerPanel({
  heartbeats,
  jobs,
}: {
  heartbeats: RunnerHeartbeatRow[];
  jobs: RunnerJobRow[];
}) {
  const claimedByRunner = new Map(
    jobs.filter((j) => j.status === "claimed").map((j) => [j.claimed_by, j]),
  );

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Runners</h2>
      <div className="flex flex-col gap-3">
        {heartbeats.map((runner) => {
          const stale = isHeartbeatStale(runner.last_heartbeat_at);
          const currentJob = claimedByRunner.get(runner.runner_name);
          return (
            <Card key={runner.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm">{runner.runner_name}</p>
                  <p className="mt-1 text-xs text-[var(--muted-fg)]">
                    last heartbeat: {formatRelativeTime(runner.last_heartbeat_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-xs uppercase",
                      stale
                        ? "text-[var(--status-warning)]"
                        : "text-[var(--status-nominal)]",
                    )}
                  >
                    {stale ? "stale" : runner.status}
                  </span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-[var(--muted-fg)]">Current job</dt>
                  <dd className="mt-0.5 font-mono">{currentJob?.job_type ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-fg)]">Completed</dt>
                  <dd className="mt-0.5 font-mono">{runner.jobs_completed}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
