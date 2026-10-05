import { useMemo } from "react";
import type { TimeEntry } from "../types";
import { formatMsClock, formatTimeOfDay } from "../utils";
import { segmentMs, segmentsForEntry } from "./TimesheetSection";

interface Props {
  entries: TimeEntry[];
}

export function TodayLog({ entries }: Props) {
  const segments = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.clockIn.localeCompare(b.clockIn));
    return sorted.flatMap(segmentsForEntry);
  }, [entries]);

  if (segments.length === 0) {
    return <p className="items-empty">No activity logged yet today.</p>;
  }

  return (
    <div className="today-log">
      {segments.map((seg, i) => (
        <div className="today-log-row" key={i}>
          <div className="today-log-rail">
            <span className={`today-log-dot${!seg.end ? " today-log-dot--active" : ""}`} />
            {i < segments.length - 1 && <span className="today-log-line" />}
          </div>
          <div className="today-log-content">
            <span className={`today-log-pill today-log-pill--${seg.type}`}>
              {seg.type === "shift" ? "Shift" : "Break"}
            </span>
            <span className="today-log-time">
              {formatTimeOfDay(seg.start)} {seg.end ? `– ${formatTimeOfDay(seg.end)}` : "– active"}
              {seg.end && (
                <>
                  {" · "}
                  <strong>total {formatMsClock(segmentMs(seg)).slice(0, 5)}</strong>
                </>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
