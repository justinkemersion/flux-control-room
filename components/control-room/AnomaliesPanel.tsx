import { Card } from "@/components/ui/Card";
import type { AnomalyRow } from "@/lib/types/control-room";
import { cn } from "@/lib/ui/cn";

const severityClass: Record<AnomalyRow["severity"], string> = {
  low: "text-[var(--muted-fg)]",
  medium: "text-[var(--status-warning)]",
  high: "text-[var(--status-warning)]",
  critical: "text-[var(--status-critical)]",
};

export function AnomaliesPanel({ anomalies }: { anomalies: AnomalyRow[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Anomalies</h2>
      <Card className="p-0">
        <ul className="divide-y divide-[var(--border)]">
          {anomalies.length === 0 ? (
            <li className="p-4 text-sm text-[var(--muted-fg)]">No open anomalies.</li>
          ) : (
            anomalies.map((anomaly) => (
              <li key={anomaly.id} className="p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{anomaly.title}</p>
                  <span className={cn("text-xs uppercase", severityClass[anomaly.severity])}>
                    {anomaly.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-fg)]">
                  {anomaly.status} · first seen{" "}
                  {new Date(anomaly.first_seen_at).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </section>
  );
}
