import type { AppTile } from "../types";
import type { Metric } from "../metrics";
import { getActivityFeed } from "../activity";
import { formatTimeOfDay } from "../utils";

interface Props {
  apps: AppTile[];
  metrics: Metric[];
  onOpen: (appId: string) => void;
}

export function WidgetsPanel({ apps, metrics, onOpen }: Props) {
  const timeClockApp = apps.find((a) => a.builtin === "timeclock");
  const clockedIn = (timeClockApp?.clockRecords ?? []).filter((r) => r.clockedIn);
  const activity = getActivityFeed(apps);

  return (
    <aside className="widgets-panel">
      {metrics.length > 0 && (
        <section className="widget-block">
          <h2 className="widget-title">At a glance</h2>
          <div className="widget-metrics">
            {metrics.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`metric-card metric-card--stacked${m.urgent ? " metric-card--urgent" : ""}`}
                onClick={() => onOpen(m.appId)}
              >
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {timeClockApp && (
        <section className="widget-block">
          <h2 className="widget-title">Clocked in now</h2>
          {clockedIn.length === 0 ? (
            <p className="widget-empty">No one clocked in right now.</p>
          ) : (
            <div className="clocked-list">
              {clockedIn.map((r) => (
                <div className="clocked-row" key={r.id}>
                  <span className="clocked-dot" />
                  <span className="clocked-name">{r.name}</span>
                  {r.since && <span className="clocked-since">since {formatTimeOfDay(r.since)}</span>}
                </div>
              ))}
            </div>
          )}
          <button type="button" className="widget-link" onClick={() => onOpen(timeClockApp.id)}>
            View time clock
          </button>
        </section>
      )}

      {activity.length > 0 && (
        <section className="widget-block">
          <h2 className="widget-title">Recent activity</h2>
          <div className="activity-list">
            {activity.map((a) => (
              <button key={a.key} type="button" className="activity-row" onClick={() => onOpen(a.appId)}>
                <span className="activity-label">{a.label}</span>
                <span className="activity-meta">{a.meta}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
