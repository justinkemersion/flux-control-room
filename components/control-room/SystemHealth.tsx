import { Card } from "@/components/ui/Card";
import type { SystemComponentRow } from "@/lib/types/control-room";
import { cn } from "@/lib/ui/cn";

const statusClass: Record<SystemComponentRow["status"], string> = {
  healthy: "text-[var(--status-nominal)]",
  degraded: "text-[var(--status-warning)]",
  down: "text-[var(--status-critical)]",
};

export function SystemHealth({ components }: { components: SystemComponentRow[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">System health</h2>
      <Card className="p-0">
        <ul className="divide-y divide-[var(--border)]">
          {components.map((component) => (
            <li
              key={component.id}
              className="flex items-center justify-between gap-3 p-3 text-sm"
            >
              <div>
                <p>{component.label}</p>
                {component.detail ? (
                  <p className="text-xs text-[var(--muted-fg)]">{component.detail}</p>
                ) : null}
              </div>
              <span className={cn("text-xs uppercase", statusClass[component.status])}>
                {component.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
