import { Card } from "@/components/ui/Card";
import type { SignalEventRow } from "@/lib/types/control-room";
import { cn } from "@/lib/ui/cn";

const severityClass: Record<SignalEventRow["severity"], string> = {
  info: "text-[var(--muted-fg)]",
  warn: "text-[var(--status-warning)]",
  error: "text-[var(--status-critical)]",
  critical: "text-[var(--status-critical)]",
};

export function EventFeed({ events }: { events: SignalEventRow[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Event feed</h2>
      <Card className="max-h-80 overflow-y-auto p-0">
        <ul className="divide-y divide-[var(--border)]">
          {events.length === 0 ? (
            <li className="p-4 text-sm text-[var(--muted-fg)]">No events yet.</li>
          ) : (
            events.map((event) => (
              <li key={event.id} className="flex gap-3 p-3 text-sm">
                <time className="shrink-0 font-mono text-xs text-[var(--muted-fg)]">
                  {new Date(event.created_at).toLocaleTimeString()}
                </time>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs uppercase", severityClass[event.severity])}>
                    {event.severity} · {event.source}
                  </p>
                  <p className="mt-0.5">{event.message}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </section>
  );
}
