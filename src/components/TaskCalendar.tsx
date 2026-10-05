import { useMemo, useState } from "react";
import type { TaskRecord } from "../types";
import { Icon } from "../icons";
import {
  DONE_STATUS,
  addDays,
  colorForStatus,
  formatDate,
  initialOf,
  startOfMonth,
  startOfWeek,
  todayIso,
  toIsoDate,
} from "../utils";
import { Modal } from "./Modal";

interface Props {
  tasks: TaskRecord[];
  statusOptions: string[];
  canManage: boolean;
  highlightName?: string;
  onSelectTask: (task: TaskRecord) => void;
  onAddForDate: (dateIso: string) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

function buildMonthGrid(monthStart: Date): Date[] {
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function TaskCalendar({ tasks, statusOptions, canManage, highlightName, onSelectTask, onAddForDate }: Props) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [dayView, setDayView] = useState<string | null>(null);

  function colorFor(t: TaskRecord) {
    return t.status === DONE_STATUS ? { bg: "#E9F5EF", fg: "#3E9A6D" } : colorForStatus(statusOptions, t.status);
  }

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const t of tasks) {
      if (!t.createdAt) continue;
      const list = map.get(t.createdAt) ?? [];
      list.push(t);
      map.set(t.createdAt, list);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => buildMonthGrid(monthStart), [monthStart]);
  const todayStr = todayIso();
  const monthLabel = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="task-calendar">
      <div className="task-calendar-head">
        <h3 className="task-calendar-month">{monthLabel}</h3>
        <div className="task-calendar-nav">
          <button
            type="button"
            className="icon-btn-sm"
            aria-label="Previous month"
            onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          >
            <Icon name="arrow-left" />
          </button>
          <button type="button" className="btn-secondary-sm" onClick={() => setMonthStart(startOfMonth(new Date()))}>
            Today
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            aria-label="Next month"
            onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          >
            <Icon name="arrow-left" className="sidebar-flip" />
          </button>
        </div>
      </div>

      <div className="task-calendar-weekdays">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="task-calendar-grid">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const inMonth = day.getMonth() === monthStart.getMonth();
          const dayTasks = tasksByDate.get(iso) ?? [];
          const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayTasks.length - visible.length;
          const hasMine = !!highlightName && dayTasks.some((t) => t.assignees?.includes(highlightName));
          const clickable = dayTasks.length > 0 || canManage;
          return (
            <div
              key={iso}
              className={`task-calendar-day${inMonth ? "" : " task-calendar-day--muted"}${
                iso === todayStr ? " task-calendar-day--today" : ""
              }${hasMine ? " task-calendar-day--mine" : ""}${clickable ? " task-calendar-day--clickable" : ""}`}
              onClick={() => {
                if (dayTasks.length > 0) {
                  setDayView(iso);
                } else if (canManage) {
                  onAddForDate(iso);
                }
              }}
            >
              <span className="task-calendar-daynum">
                {day.getDate()}
                {hasMine && <span className="task-calendar-mine-dot" title={`${highlightName} has tasks logged on this day`} />}
              </span>
              <div className="task-calendar-tasks">
                {visible.map((t) => {
                  const color = colorFor(t);
                  const mine = !!highlightName && t.assignees?.includes(highlightName);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`task-calendar-chip${t.status === DONE_STATUS ? " task-done" : ""}${
                        mine ? " task-calendar-chip--mine" : ""
                      }`}
                      style={{ background: color.bg, color: color.fg }}
                      title={mine ? `${t.title} (assigned to ${highlightName})` : t.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(t);
                      }}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {overflow > 0 && <span className="task-calendar-more">+{overflow} more</span>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!dayView} onClose={() => setDayView(null)} title={dayView ? formatDate(dayView) : "Tasks"}>
        <div className="items-list">
          {(dayView ? (tasksByDate.get(dayView) ?? []) : []).map((t) => {
            const color = colorFor(t);
            const assignees = t.assignees ?? [];
            return (
              <button
                key={t.id}
                type="button"
                className="items-row items-row--clickable task-calendar-day-row"
                onClick={() => onSelectTask(t)}
              >
                <div className="items-row-text">
                  <span className={`items-row-name${t.status === DONE_STATUS ? " task-done" : ""}`}>{t.title}</span>
                </div>
                {assignees.length > 0 && (
                  <div className="assignee-chips">
                    {assignees.map((name) => (
                      <span className="assignee-chip" key={name} title={name}>
                        {initialOf(name)}
                      </span>
                    ))}
                  </div>
                )}
                <span className="status-pill" style={{ background: color.bg, color: color.fg }}>
                  {t.status}
                </span>
              </button>
            );
          })}
        </div>
        {canManage && dayView && (
          <div className="form-buttons">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onAddForDate(dayView)}
            >
              + Add task for this day
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
