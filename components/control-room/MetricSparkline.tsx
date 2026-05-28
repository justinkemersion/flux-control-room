import type { MetricSampleRow } from "@/lib/types/control-room";

export function MetricSparkline({
  samples,
  className,
}: {
  samples: MetricSampleRow[];
  className?: string;
}) {
  const points = [...samples].reverse();
  if (points.length < 2) {
    return (
      <svg viewBox="0 0 100 24" className={className} aria-hidden>
        <line x1="0" y1="12" x2="100" y2="12" stroke="var(--border)" strokeWidth="1" />
      </svg>
    );
  }

  const values = points.map((p) => Number(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 22 - ((value - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 24" className={className} aria-hidden>
      <polyline
        fill="none"
        stroke="var(--status-nominal)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords}
        opacity="0.85"
      />
    </svg>
  );
}
