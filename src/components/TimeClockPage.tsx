import { useEffect, useMemo, useState } from "react";
import type { AppTile, ClockRecord, Role, TimeEntry } from "../types";
import { Icon } from "../icons";
import {
  breakTotalMs,
  CURRENT_USER_NAME,
  formatDate,
  formatElapsed,
  formatHoursMinutes,
  formatTimeOfDay,
  initialOf,
  newId,
  nowIso,
  todayIso,
  workedMs,
} from "../utils";
import { Modal } from "./Modal";
import { TimeClockForm } from "./TimeClockForm";
import { TimeEntryEditForm } from "./TimeEntryEditForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (patch: { clockRecords?: ClockRecord[]; timeEntries?: TimeEntry[] }) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function TimeClockPage({ app, role, onBack, onUpdate }: Props) {
  const records = app.clockRecords ?? [];
  const entries = app.timeEntries ?? [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClockRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [, forceTick] = useState(0);

  const isAdmin = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const myOpenEntry = entries.find((e) => e.name === CURRENT_USER_NAME && !e.clockOut);
  const myOpenBreak = myOpenEntry?.breaks.find((b) => !b.end);
  const myEntries = useMemo(
    () =>
      entries
        .filter((e) => e.name === CURRENT_USER_NAME)
        .sort((a, b) => (b.date + b.clockIn).localeCompare(a.date + a.clockIn)),
    [entries],
  );
  const pendingEntries = useMemo(() => entries.filter((e) => e.editRequest), [entries]);

  const otherRecords = records.filter((r) => r.name !== CURRENT_USER_NAME);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return otherRecords;
    return otherRecords.filter((r) => r.name.toLowerCase().includes(q));
  }, [otherRecords, query]);

  useEffect(() => {
    if (!myOpenEntry) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [myOpenEntry]);

  function updateMyClockStatus(clockedIn: boolean, since?: string) {
    const existing = records.find((r) => r.name === CURRENT_USER_NAME);
    if (existing) {
      return records.map((r) => (r.id === existing.id ? { ...r, clockedIn, since } : r));
    }
    return [...records, { id: newId("clock"), name: CURRENT_USER_NAME, clockedIn, since }];
  }

  function handleStart() {
    const entry: TimeEntry = {
      id: newId("te"),
      name: CURRENT_USER_NAME,
      date: todayIso(),
      clockIn: nowIso(),
      breaks: [],
    };
    onUpdate({
      timeEntries: [...entries, entry],
      clockRecords: updateMyClockStatus(true, entry.clockIn),
    });
  }

  function handleEnd() {
    if (!myOpenEntry) return;
    const closedOut = nowIso();
    const updatedEntries = entries.map((e) => {
      if (e.id !== myOpenEntry.id) return e;
      const breaks = e.breaks.map((b) => (b.end ? b : { ...b, end: closedOut }));
      return { ...e, clockOut: closedOut, breaks };
    });
    onUpdate({
      timeEntries: updatedEntries,
      clockRecords: updateMyClockStatus(false, undefined),
    });
  }

  function handleStartBreak() {
    if (!myOpenEntry || myOpenBreak) return;
    const updatedEntries = entries.map((e) =>
      e.id === myOpenEntry.id
        ? { ...e, breaks: [...e.breaks, { id: newId("brk"), start: nowIso() }] }
        : e,
    );
    onUpdate({ timeEntries: updatedEntries });
  }

  function handleEndBreak() {
    if (!myOpenEntry || !myOpenBreak) return;
    const closedAt = nowIso();
    const updatedEntries = entries.map((e) =>
      e.id === myOpenEntry.id
        ? { ...e, breaks: e.breaks.map((b) => (b.id === myOpenBreak.id ? { ...b, end: closedAt } : b)) }
        : e,
    );
    onUpdate({ timeEntries: updatedEntries });
  }

  function handleRequestEdit(clockIn: string | undefined, clockOut: string | undefined, note: string) {
    if (!editingEntry || !clockIn) return;
    const updatedEntries = entries.map((e) =>
      e.id === editingEntry.id
        ? { ...e, editRequest: { clockIn, clockOut, note: note || undefined, requestedAt: nowIso() } }
        : e,
    );
    onUpdate({ timeEntries: updatedEntries });
    setEditingEntry(null);
  }

  function handleApproveEdit(entry: TimeEntry) {
    if (!entry.editRequest) return;
    const { clockIn, clockOut } = entry.editRequest;
    const updatedEntries = entries.map((e) =>
      e.id === entry.id ? { ...e, clockIn: clockIn ?? e.clockIn, clockOut, editRequest: undefined } : e,
    );
    onUpdate({ timeEntries: updatedEntries });
  }

  function handleRejectEdit(entry: TimeEntry) {
    const updatedEntries = entries.map((e) => (e.id === entry.id ? { ...e, editRequest: undefined } : e));
    onUpdate({ timeEntries: updatedEntries });
  }

  function toggleOther(record: ClockRecord) {
    const clockingIn = !record.clockedIn;
    onUpdate({
      clockRecords: records.map((r) =>
        r.id === record.id ? { ...r, clockedIn: clockingIn, since: clockingIn ? nowIso() : undefined } : r,
      ),
    });
  }

  function handleAddSave(record: ClockRecord) {
    onUpdate({ clockRecords: [...records, record] });
    setAdding(false);
  }

  function handleEditSave(record: ClockRecord) {
    onUpdate({ clockRecords: records.map((r) => (r.id === record.id ? record : r)) });
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate({ clockRecords: records.filter((r) => r.id !== id) });
    setConfirmDeleteId(null);
  }

  return (
    <div className="items-page">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="arrow-left" />
        Back to dashboard
      </button>

      <div className="items-page-head">
        <div className="badge items-page-badge" style={{ background: tint.bg, color: tint.fg }}>
          {app.icon ? <Icon name={app.icon} /> : <span className="badge-letter">{app.initial || initialOf(app.name)}</span>}
        </div>
        <div>
          <h1 className="items-page-title">{app.name}</h1>
          {app.description && <p className="items-page-desc">{app.description}</p>}
        </div>
      </div>

      <div
        className={`clock-hero${myOpenEntry ? " clock-hero--active" : ""}${myOpenBreak ? " clock-hero--break" : ""}`}
      >
        <div className="clock-hero-info">
          <span className="clock-hero-label">
            {myOpenBreak ? "On break" : myOpenEntry ? "Clocked in" : "Ready to start your shift?"}
          </span>
          <span className="clock-hero-timer">{myOpenEntry ? formatElapsed(myOpenEntry.clockIn) : "00:00:00"}</span>
          {myOpenEntry && (
            <span className="clock-hero-sub">
              {myOpenBreak
                ? `On break since ${formatTimeOfDay(myOpenBreak.start)}`
                : `Since ${formatTimeOfDay(myOpenEntry.clockIn)}`}
            </span>
          )}
        </div>
        <div className="clock-hero-actions">
          {myOpenEntry && (
            <button
              type="button"
              className="clock-hero-btn clock-hero-btn--break"
              onClick={myOpenBreak ? handleEndBreak : handleStartBreak}
            >
              <Icon name="clock" />
              {myOpenBreak ? "End break" : "Start break"}
            </button>
          )}
          <button
            type="button"
            className={`clock-hero-btn${myOpenEntry ? " clock-hero-btn--end" : " clock-hero-btn--start"}`}
            onClick={myOpenEntry ? handleEnd : handleStart}
          >
            <Icon name="clock" />
            {myOpenEntry ? "End" : "Start"}
          </button>
        </div>
      </div>

      <div className="items-section">
        <h2 className="items-section-title">My timesheet</h2>
        {myEntries.length === 0 ? (
          <p className="items-empty">No shifts recorded yet.</p>
        ) : (
          <div className="items-list">
            {myEntries.map((entry) => (
              <div className="items-row" key={entry.id}>
                <div className="items-row-text">
                  <span className="items-row-name">{formatDate(entry.date)}</span>
                  <span className="items-row-desc">
                    {formatTimeOfDay(entry.clockIn)} –{" "}
                    {entry.clockOut ? formatTimeOfDay(entry.clockOut) : "In progress"}
                    {entry.breaks.length > 0 ? ` · ${formatHoursMinutes(breakTotalMs(entry.breaks))} break` : ""}
                    {` · ${formatHoursMinutes(workedMs(entry))} worked`}
                  </span>
                </div>
                {entry.editRequest && (
                  <span className="status-pill" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                    Pending approval
                  </span>
                )}
                <div className="items-row-manage items-row-manage--active">
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label={`Request edit for ${formatDate(entry.date)}`}
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Icon name="edit" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && pendingEntries.length > 0 && (
        <div className="items-section">
          <h2 className="items-section-title">Pending time edits</h2>
          <div className="items-list">
            {pendingEntries.map((entry) => (
              <div className="items-row" key={entry.id}>
                <div className="items-row-text">
                  <span className="items-row-name">
                    {entry.name} · {formatDate(entry.date)}
                  </span>
                  <span className="items-row-desc">
                    Current: {formatTimeOfDay(entry.clockIn)} –{" "}
                    {entry.clockOut ? formatTimeOfDay(entry.clockOut) : "In progress"}
                    {"  →  Requested: "}
                    {formatTimeOfDay(entry.editRequest?.clockIn ?? entry.clockIn)} –{" "}
                    {entry.editRequest?.clockOut ? formatTimeOfDay(entry.editRequest.clockOut) : "In progress"}
                  </span>
                  {entry.editRequest?.note && <span className="items-row-desc">"{entry.editRequest.note}"</span>}
                </div>
                <div className="items-row-manage items-row-manage--active">
                  <button type="button" className="btn-secondary-sm" onClick={() => handleRejectEdit(entry)}>
                    Reject
                  </button>
                  <button type="button" className="btn-primary-sm" onClick={() => handleApproveEdit(entry)}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="items-section">
          <h2 className="items-section-title">Staff roster</h2>
          <div className="items-toolbar">
            <div className="search-field">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search staff..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
              + Add staff
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="items-empty">
              {otherRecords.length === 0 ? "No other staff yet." : "No staff match your search."}
            </p>
          ) : (
            <div className="items-list">
              {filtered.map((r) => (
                <div className="items-row" key={r.id}>
                  <button
                    type="button"
                    className={`task-check task-check--${r.clockedIn ? "done" : "todo"}`}
                    onClick={() => toggleOther(r)}
                    aria-label={`${r.clockedIn ? "Clock out" : "Clock in"} ${r.name}`}
                  >
                    {r.clockedIn && <Icon name="check-square" />}
                  </button>
                  <div className="items-row-text">
                    <span className="items-row-name">{r.name}</span>
                    <span className="items-row-desc">
                      {r.clockedIn ? `Clocked in${r.since ? ` at ${formatTimeOfDay(r.since)}` : ""}` : "Clocked out"}
                    </span>
                  </div>
                  <div
                    className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Edit ${r.name}`}
                      onClick={() => setEditing(r)}
                    >
                      <Icon name="edit" />
                    </button>
                    {confirmDeleteId === r.id ? (
                      <span className="confirm-delete">
                        <button type="button" className="btn-danger-sm" onClick={() => handleDelete(r.id)}>
                          Delete
                        </button>
                        <button type="button" className="btn-secondary-sm" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="icon-btn-sm icon-btn-danger"
                        aria-label={`Delete ${r.name}`}
                        onClick={() => setConfirmDeleteId(r.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add staff">
        <TimeClockForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit staff">
        {editing && <TimeClockForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!editingEntry} onClose={() => setEditingEntry(null)} title="Request a time edit">
        {editingEntry && (
          <TimeEntryEditForm
            entry={editingEntry}
            onSave={handleRequestEdit}
            onCancel={() => setEditingEntry(null)}
          />
        )}
      </Modal>
    </div>
  );
}
