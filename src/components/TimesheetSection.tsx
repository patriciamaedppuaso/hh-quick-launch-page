import { useMemo, useState } from "react";
import type { TimeEntry } from "../types";
import { Icon } from "../icons";
import {
  addDays,
  breakTotalMs,
  formatHoursMinutes,
  formatTimeOfDay,
  startOfWeek,
  toIsoDate,
  toZonedDate,
  workedMs,
} from "../utils";

interface Props {
  entries: TimeEntry[];
  onRequestEdit: (entry: TimeEntry) => void;
}

const WEEKLY_OVERTIME_MS = 40 * 60 * 60 * 1000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Segment {
  type: "shift" | "break";
  start: string;
  end?: string;
}

function segmentsForEntry(entry: TimeEntry): Segment[] {
  const segments: Segment[] = [];
  const sortedBreaks = [...entry.breaks].sort((a, b) => a.start.localeCompare(b.start));
  let cursor = entry.clockIn;
  for (const brk of sortedBreaks) {
    segments.push({ type: "shift", start: cursor, end: brk.start });
    segments.push({ type: "break", start: brk.start, end: brk.end });
    cursor = brk.end ?? brk.start;
  }
  segments.push({ type: "shift", start: cursor, end: entry.clockOut });
  return segments;
}

function segmentMs(seg: Segment): number {
  const start = new Date(seg.start).getTime();
  const end = seg.end ? new Date(seg.end).getTime() : Date.now();
  return Math.max(0, end - start);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function TimesheetSection({ entries, onRequestEdit }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(toZonedDate(new Date())));

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const iso = toIsoDate(date);
      const dayEntries = entries.filter((e) => e.date === iso).sort((a, b) => a.clockIn.localeCompare(b.clockIn));
      const worked = dayEntries.reduce((sum, e) => sum + workedMs(e), 0);
      const breaks = dayEntries.reduce((sum, e) => sum + breakTotalMs(e.breaks), 0);
      return { date, iso, entries: dayEntries, worked, breaks };
    });
  }, [weekStart, entries]);

  const weeklyWorked = days.reduce((sum, d) => sum + d.worked, 0);
  const weeklyBreaks = days.reduce((sum, d) => sum + d.breaks, 0);
  const regular = Math.min(weeklyWorked, WEEKLY_OVERTIME_MS);
  const overtime = Math.max(0, weeklyWorked - WEEKLY_OVERTIME_MS);

  const rangeLabel = `${days[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  function exportCsv() {
    const rows = [["Date", "Type", "Start", "End", "Duration"]];
    for (const day of days) {
      const dateLabel = day.date.toLocaleDateString();
      if (day.entries.length === 0) {
        rows.push([dateLabel, "--", "--", "--", "--"]);
        continue;
      }
      for (const entry of day.entries) {
        for (const seg of segmentsForEntry(entry)) {
          rows.push([
            dateLabel,
            seg.type === "shift" ? "Shift" : "Break",
            formatTimeOfDay(seg.start),
            seg.end ? formatTimeOfDay(seg.end) : "In progress",
            formatHoursMinutes(segmentMs(seg)),
          ]);
        }
      }
    }
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${toIsoDate(weekStart)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="items-section">
      <div className="timesheet-head">
        <h2 className="items-section-title">My timesheet</h2>
        <div className="timesheet-nav">
          <button
            type="button"
            className="icon-btn-sm"
            aria-label="Previous week"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
          >
            <Icon name="arrow-left" />
          </button>
          <span className="timesheet-range">{rangeLabel}</span>
          <button
            type="button"
            className="icon-btn-sm"
            aria-label="Next week"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            <Icon name="arrow-left" className="sidebar-flip" />
          </button>
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setWeekStart(startOfWeek(toZonedDate(new Date())))}
          >
            This week
          </button>
          <button type="button" className="btn-secondary-sm" onClick={exportCsv}>
            Export
          </button>
        </div>
      </div>

      <div className="timesheet-summary">
        <div className="timesheet-stat">
          <span className="timesheet-stat-label">Regular</span>
          <span className="timesheet-stat-value">{formatHoursMinutes(regular)}</span>
        </div>
        <div className={`timesheet-stat${overtime > 0 ? " timesheet-stat--urgent" : ""}`}>
          <span className="timesheet-stat-label">Overtime</span>
          <span className="timesheet-stat-value">{formatHoursMinutes(overtime)}</span>
        </div>
        <div className="timesheet-stat">
          <span className="timesheet-stat-label">Unpaid breaks</span>
          <span className="timesheet-stat-value">{formatHoursMinutes(weeklyBreaks)}</span>
        </div>
        <div className="timesheet-stat timesheet-stat--total">
          <span className="timesheet-stat-label">Total worked</span>
          <span className="timesheet-stat-value">{formatHoursMinutes(weeklyWorked)}</span>
        </div>
      </div>

      <div className="timesheet-days">
        {days.map((day) => (
          <div className="timesheet-day" key={day.iso}>
            <div className="timesheet-day-head">
              <span className="timesheet-day-label">
                {DAY_LABELS[day.date.getDay()]}{" "}
                {day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="timesheet-day-total">{day.worked > 0 ? formatHoursMinutes(day.worked) : "--"}</span>
            </div>
            {day.entries.length === 0 ? (
              <p className="timesheet-day-empty">No activity</p>
            ) : (
              day.entries.map((entry) => (
                <div className="timesheet-entry" key={entry.id}>
                  <div className="timesheet-segments">
                    {segmentsForEntry(entry).map((seg, i) => (
                      <div className={`timesheet-segment timesheet-segment--${seg.type}`} key={i}>
                        <span className="timesheet-segment-type">{seg.type === "shift" ? "Shift" : "Break"}</span>
                        <span className="timesheet-segment-time">
                          {formatTimeOfDay(seg.start)} – {seg.end ? formatTimeOfDay(seg.end) : "In progress"}
                        </span>
                        <span className="timesheet-segment-duration">{formatHoursMinutes(segmentMs(seg))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="timesheet-entry-actions">
                    {entry.editRequest && (
                      <span
                        className="status-pill"
                        style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                      >
                        Pending approval
                      </span>
                    )}
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Request edit for ${day.iso}`}
                      onClick={() => onRequestEdit(entry)}
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
