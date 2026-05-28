import { auth } from "@/auth";
import { getAppDisplayName } from "@/lib/config/app";
import { loadControlRoomDashboard } from "@/lib/control-room/load-dashboard";
import { AnomaliesPanel } from "@/components/control-room/AnomaliesPanel";
import { EventFeed } from "@/components/control-room/EventFeed";
import { MetricsGrid } from "@/components/control-room/MetricsGrid";
import { OperatorActionsPanel } from "@/components/control-room/OperatorActionsPanel";
import { RefreshControl } from "@/components/control-room/RefreshControl";
import { RunnerPanel } from "@/components/control-room/RunnerPanel";
import { StatusSummary } from "@/components/control-room/StatusSummary";
import { SystemHealth } from "@/components/control-room/SystemHealth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FluxUserSubCard } from "@/components/dev/FluxUserSubCard";

const FACILITY_NAME = "Vessel Reactor One";

export default async function ControlRoomPage() {
  const session = await auth();
  const sub = session!.user!.id;

  let data: Awaited<ReturnType<typeof loadControlRoomDashboard>> | null = null;
  let loadError: string | null = null;

  try {
    data = await loadControlRoomDashboard(sub);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Unable to load control room data";
  }

  return (
    <>
      <PageHeader
        title={getAppDisplayName()}
        description="Operational dashboard for Vessel Reactor One"
      />
      <RefreshControl />

      {loadError ? (
        <Card className="mb-6 border-[var(--status-warning)]/40">
          <p className="text-sm text-[var(--status-warning)]">{loadError}</p>
          <p className="mt-2 text-xs text-[var(--muted-fg)]">
            Ensure Flux is configured, migrations are pushed, and data is seeded for your account.
          </p>
        </Card>
      ) : null}

      {!loadError && data && data.metrics.length === 0 ? (
        <div className="mb-6 flex flex-col gap-4">
          <Card>
            <p className="text-sm">No facility data yet for your account.</p>
            <p className="mt-2 text-xs text-[var(--muted-fg)]">
              Copy your Flux user id below into <code className="font-mono">.env</code>, then run{" "}
              <code className="font-mono">pnpm seed:control-room</code>.
            </p>
          </Card>
          <FluxUserSubCard sub={sub} />
        </div>
      ) : null}

      {data ? (
        <div className="flex flex-col gap-6">
          <StatusSummary
            facilityName={FACILITY_NAME}
            systemStatus={data.systemStatus}
            uptime="14d 6h"
            activeRunners={data.activeRunners}
            pendingJobs={data.pendingJobs}
            lastSignal={data.lastSignal}
          />

          <MetricsGrid metrics={data.metrics} samplesByMetricId={data.samplesByMetricId} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RunnerPanel heartbeats={data.heartbeats} jobs={data.claimedJobs} />
            <SystemHealth components={data.components} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <EventFeed events={data.events} />
            <AnomaliesPanel anomalies={data.anomalies} />
          </div>

          <OperatorActionsPanel />
        </div>
      ) : !loadError ? (
        <Card>
          <p className="text-sm text-[var(--muted-fg)]">Loading control room…</p>
        </Card>
      ) : null}
    </>
  );
}
