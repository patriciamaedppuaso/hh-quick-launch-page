import type { Metric } from "../metrics";

interface Props {
  metrics: Metric[];
  onOpen: (appId: string) => void;
}

export function MetricsRow({ metrics, onOpen }: Props) {
  if (metrics.length === 0) return null;

  return (
    <div className="metrics-row">
      {metrics.map((m) => (
        <button
          key={m.key}
          type="button"
          className={`metric-card${m.urgent ? " metric-card--urgent" : ""}`}
          onClick={() => onOpen(m.appId)}
        >
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">{m.value}</div>
        </button>
      ))}
    </div>
  );
}
