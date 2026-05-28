import { Card } from "@/components/ui/Card";
import { MetricSparkline } from "./MetricSparkline";
import type { ControlMetricRow, MetricSampleRow } from "@/lib/types/control-room";
import { cn } from "@/lib/ui/cn";

const statusColor: Record<ControlMetricRow["status"], string> = {
  nominal: "text-[var(--status-nominal)]",
  warning: "text-[var(--status-warning)]",
  critical: "text-[var(--status-critical)]",
};

export function MetricsGrid({
  metrics,
  samplesByMetricId,
}: {
  metrics: ControlMetricRow[];
  samplesByMetricId: Record<string, MetricSampleRow[]>;
}) {
  const primary = metrics.filter((m) =>
    [
      "reactor_stability",
      "thermal_load",
      "loop_pressure",
      "signal_confidence",
      "queue_depth",
      "system_load",
    ].includes(m.metric_key),
  );

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Metrics</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map((metric) => (
          <Card key={metric.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted-fg)]">
                  {metric.label}
                </p>
                <p className="mt-1 font-mono text-xl">
                  {metric.current_value}
                  {metric.unit ? (
                    <span className="ml-1 text-sm text-[var(--muted-fg)]">{metric.unit}</span>
                  ) : null}
                </p>
              </div>
              <span className={cn("text-xs uppercase", statusColor[metric.status])}>
                {metric.status}
              </span>
            </div>
            <MetricSparkline
              samples={samplesByMetricId[metric.id] ?? []}
              className="mt-3 h-6 w-full"
            />
          </Card>
        ))}
      </div>
    </section>
  );
}
