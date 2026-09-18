import { useMemo, useRef, useState } from "react";
import type { TimeEntry } from "../types";
import { Icon } from "../icons";
import {
  addDays,
  breakTotalMs,
  formatHoursMinutes,
  formatTimeOfDay,
  initialOf,
  startOfWeek,
  toIsoDate,
  toZonedDate,
  workedMs,
} from "../utils";
import { useClickOutside } from "../hooks/useClickOutside";
import { useToast } from "./ToastProvider";

interface Props {
  title: string;
  personName: string;
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

export function TimesheetSection({ title, personName, entries, onRequestEdit }: Props) {
  const toast = useToast();
  const fileSlug = personName.trim().toLowerCase().replace(/\s+/g, "-") || "employee";
  const [weekStart, setWeekStart] = useState(() => startOfWeek(toZonedDate(new Date())));
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(exportMenuRef, () => setExportOpen(false));

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

  function buildTableRows(): string[][] {
    const rows: string[][] = [];
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
    return rows;
  }

  function exportCsv() {
    setExportOpen(false);
    try {
      const rows = [["Date", "Type", "Start", "End", "Duration"], ...buildTableRows()];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheet-${fileSlug}-${toIsoDate(weekStart)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      console.error("CSV export failed:", err);
      toast.error("Couldn't export the CSV. Please try again.");
    }
  }

  async function exportPdf() {
    setExportOpen(false);
    try {
    // Loaded on demand: jsPDF drags in html2canvas + dompurify (for a feature
    // we don't use), which would otherwise bloat every page load for a
    // button most people won't click.
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    type Rgb = [number, number, number];
    type Cell = string | { content: string; rowSpan?: number; styles?: Record<string, unknown> };

    const employeeName = personName || "Employee";
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // header: avatar + name (left), date range (center)
    doc.setFillColor(71, 156, 164);
    doc.circle(margin + 5, 16, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(initialOf(employeeName), margin + 5, 18, { align: "center" });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.text(employeeName, margin + 13, 18);

    doc.setFontSize(13);
    doc.text(rangeLabel, pageWidth / 2, 18, { align: "center" });

    // stat badges -- only what this app actually tracks (no fabricated
    // paid-break/absence categories the data model has no concept of)
    const stats: { label: string; value: string; fill: Rgb; text: Rgb }[] = [
      { label: "Work Hours", value: formatHoursMinutes(weeklyWorked), fill: [85, 169, 130], text: [255, 255, 255] },
      { label: "Regular", value: formatHoursMinutes(regular), fill: [223, 238, 238], text: [50, 126, 136] },
      {
        label: "Overtime",
        value: formatHoursMinutes(overtime),
        fill: overtime > 0 ? [242, 183, 101] : [230, 230, 230],
        text: overtime > 0 ? [255, 255, 255] : [110, 110, 110],
      },
      { label: "Unpaid breaks", value: formatHoursMinutes(weeklyBreaks), fill: [237, 224, 210], text: [140, 100, 60] },
    ];

    const badgeWidth = 48;
    const badgeGap = 8;
    const badgeY = 28;
    stats.forEach((s, i) => {
      const x = margin + i * (badgeWidth + badgeGap);
      doc.setFillColor(...s.fill);
      doc.roundedRect(x, badgeY, badgeWidth, 14, 3, 3, "F");
      doc.setTextColor(...s.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(s.value, x + badgeWidth / 2, badgeY + 9, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(s.label, x + badgeWidth / 2, badgeY + 20, { align: "center" });
    });

    // table body: one row per Shift/Break segment, with Day and Daily total
    // merged (rowSpan) across each day's segments
    const body: Cell[][] = [];
    for (const day of days) {
      const dayLabel = `${DAY_LABELS[day.date.getDay()]} ${day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
      if (day.entries.length === 0) {
        body.push([dayLabel, "--", "--", "--", "--", "--"]);
        continue;
      }
      const segs = day.entries.flatMap((entry) => segmentsForEntry(entry));
      segs.forEach((seg, idx) => {
        const row: Cell[] = [];
        if (idx === 0) row.push({ content: dayLabel, rowSpan: segs.length, styles: { valign: "middle", fontStyle: "bold" } });
        row.push(
          seg.type === "break"
            ? {
                content: "Lunch break (unpaid)",
                styles: { fillColor: [216, 27, 145], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
              }
            : "Shift",
          formatTimeOfDay(seg.start),
          seg.end ? formatTimeOfDay(seg.end) : "In progress",
          formatHoursMinutes(segmentMs(seg)),
        );
        if (idx === 0) {
          row.push({
            content: day.worked > 0 ? formatHoursMinutes(day.worked) : "--",
            rowSpan: segs.length,
            styles: { valign: "middle", fontStyle: "bold" },
          });
        }
        body.push(row);
      });
    }

    autoTable(doc, {
      startY: badgeY + 28,
      head: [["Day", "Type", "Clock in", "Clock out", "Total hours", "Daily total"]],
      body,
      styles: { fontSize: 9, valign: "middle" },
      headStyles: { fillColor: [50, 126, 136], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, 16, { align: "right" });
    }

    doc.save(`timesheet-${fileSlug}-${toIsoDate(weekStart)}.pdf`);
    toast.success("PDF exported");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Couldn't export the PDF. Please try again.");
    }
  }

  return (
    <div className="items-section">
      <div className="timesheet-head">
        <h2 className="items-section-title">{title}</h2>
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
          <input
            type="date"
            className="timesheet-jump"
            aria-label="Jump to a week"
            max={toIsoDate(toZonedDate(new Date()))}
            value={toIsoDate(weekStart)}
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-").map(Number);
              setWeekStart(startOfWeek(new Date(y, m - 1, d)));
            }}
          />
          <div className="timesheet-export" ref={exportMenuRef}>
            <button type="button" className="btn-secondary-sm" onClick={() => setExportOpen((v) => !v)}>
              Export
            </button>
            {exportOpen && (
              <div className="dropdown dropdown-narrow timesheet-export-menu">
                <button type="button" className="dropdown-item" onClick={exportCsv}>
                  Export CSV
                </button>
                <button type="button" className="dropdown-item" onClick={exportPdf}>
                  Export PDF
                </button>
              </div>
            )}
          </div>
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
