import { cn } from "@/lib/ui/cn";
import type { SystemStatus } from "@/lib/types/control-room";

const statusStyles: Record<SystemStatus, string> = {
  nominal: "bg-[var(--status-nominal)]/15 text-[var(--status-nominal)] border-[var(--status-nominal)]/30",
  degraded: "bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  critical: "bg-[var(--status-critical)]/15 text-[var(--status-critical)] border-[var(--status-critical)]/30",
};

export function StatusSummary({
  facilityName,
  systemStatus,
  uptime,
  activeRunners,
  pendingJobs,
  lastSignal,
}: {
  facilityName: string;
  systemStatus: SystemStatus;
  uptime: string;
  activeRunners: number;
  pendingJobs: number;
  lastSignal: string | null;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted-fg)]">Facility</p>
          <h2 className="text-lg font-medium">{facilityName}</h2>
        </div>
        <span
          className={cn(
            "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
            statusStyles[systemStatus],
          )}
        >
          {systemStatus}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs text-[var(--muted-fg)]">Uptime</dt>
          <dd className="mt-1 font-mono">{uptime}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-fg)]">Active runners</dt>
          <dd className="mt-1 font-mono">{activeRunners}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-fg)]">Pending jobs</dt>
          <dd className="mt-1 font-mono">{pendingJobs}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-fg)]">Last signal</dt>
          <dd className="mt-1 font-mono text-xs">
            {lastSignal ? new Date(lastSignal).toLocaleString() : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
