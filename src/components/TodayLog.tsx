import { useMemo } from "react";
import type { Punch } from "../types";
import { formatMsClock, formatTimeOfDay, punchMs } from "../utils";

interface Props {
  punches: Punch[];
}

export function TodayLog({ punches }: Props) {
  const sorted = useMemo(() => [...punches].sort((a, b) => a.start.localeCompare(b.start)), [punches]);

  if (sorted.length === 0) {
    return <p className="items-empty">No activity logged yet today.</p>;
  }

  return (
    <div className="today-log">
      {sorted.map((p, i) => (
        <div className="today-log-row" key={p.id}>
          <div className="today-log-rail">
            <span className={`today-log-dot${!p.end ? " today-log-dot--active" : ""}`} />
            {i < sorted.length - 1 && <span className="today-log-line" />}
          </div>
          <div className="today-log-content">
            <span className={`today-log-pill today-log-pill--${p.type}`}>
              {p.type === "shift" ? "Shift" : "Break"}
            </span>
            <span className="today-log-time">
              {formatTimeOfDay(p.start)} {p.end ? `– ${formatTimeOfDay(p.end)}` : "– active"}
              {p.end && (
                <>
                  {" · "}
                  <strong>total {formatMsClock(punchMs(p)).slice(0, 5)}</strong>
                </>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
