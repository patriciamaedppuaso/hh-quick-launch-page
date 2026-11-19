import { useEffect, useMemo, useState } from "react";
import type { AppTile, ClockRecord, Punch, RequestType, Role, TimeOffRequest } from "../types";
import { Icon } from "../icons";
import { insertOpenPunch, isOpenPunchConflict } from "../lib/db";
import {
  formatDate,
  formatElapsed,
  formatMsClock,
  formatTimeOfDay,
  initialOf,
  newId,
  nowIso,
  todayIso,
  toZonedDate,
  workedMsFromPunches,
} from "../utils";
import { Modal } from "./Modal";
import { TimeClockForm } from "./TimeClockForm";
import { PunchEditForm } from "./PunchEditForm";
import { TimesheetSection } from "./TimesheetSection";
import { RequestForm } from "./RequestForm";
import { TodayLog } from "./TodayLog";
import { useToast } from "./ToastProvider";

interface Props {
  app: AppTile;
  role: Role;
  currentUserName: string;
  onBack: () => void;
  onUpdate: (patch: {
    clockRecords?: ClockRecord[];
    punches?: Punch[];
    requests?: TimeOffRequest[];
  }) => Promise<void> | void;
}

const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  shift: "Shift",
  break: "Break",
  absence: "Absence",
};

const REQUEST_STATUS_COLOR: Record<TimeOffRequest["status"], { bg: string; fg: string }> = {
  pending: { bg: "#FCF0DC", fg: "#B9772E" },
  approved: { bg: "#E9F5EF", fg: "#3E9A6D" },
  denied: { bg: "#F6E2DD", fg: "#C05A4A" },
};

function describeRequest(r: TimeOffRequest): string {
  if (r.type === "absence") {
    const range = r.endDate && r.endDate !== r.date ? `${formatDate(r.date)} – ${formatDate(r.endDate)}` : formatDate(r.date);
    return range;
  }
  const time = r.startTime ? `${r.startTime}${r.endTime ? `–${r.endTime}` : ""}` : undefined;
  return [formatDate(r.date), time].filter(Boolean).join(" · ");
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function TimeClockPage({ app, role, currentUserName, onBack, onUpdate }: Props) {
  const toast = useToast();
  const records = app.clockRecords ?? [];
  const punches = app.punches ?? [];
  const requests = app.requests ?? [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClockRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPunch, setEditingPunch] = useState<Punch | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [requestDate, setRequestDate] = useState<string | undefined>(undefined);
  const [requestEmployeeName, setRequestEmployeeName] = useState(currentUserName);
  const [viewingName, setViewingName] = useState(currentUserName);
  const [, forceTick] = useState(0);
  const [confirmAction, setConfirmAction] = useState<"start" | "end" | "startBreak" | "endBreak" | null>(null);
  const [clockBusy, setClockBusy] = useState(false);

  const isAdmin = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  // Picks the most recently started open punch, not just the first one found --
  // if a stale punch from an earlier day is ever left stuck open (e.g. a dropped
  // end action), this keeps the clock focused on today's punch instead of the
  // old one.
  const myOpenPunch = punches
    .filter((p) => p.name === currentUserName && !p.end)
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  const isBreakOpen = myOpenPunch?.type === "break";
  const myTodayPunches = useMemo(
    () => punches.filter((p) => p.name === currentUserName && p.date === todayIso()),
    [punches, currentUserName],
  );
  const todayWorkedMs = workedMsFromPunches(myTodayPunches);
  const todayLabel = toZonedDate(new Date()).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const pendingPunches = useMemo(() => punches.filter((p) => p.editRequest), [punches]);
  const myRequests = useMemo(
    () =>
      requests
        .filter((r) => r.employeeName === currentUserName)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [requests, currentUserName],
  );
  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending").sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)),
    [requests],
  );

  const otherRecords = records.filter((r) => r.name !== currentUserName);
  const viewedPunches = useMemo(
    () =>
      punches
        .filter((p) => p.name === viewingName)
        .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)),
    [punches, viewingName],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return otherRecords;
    return otherRecords.filter((r) => r.name.toLowerCase().includes(q));
  }, [otherRecords, query]);

  useEffect(() => {
    if (!myOpenPunch) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [myOpenPunch]);

  function updateMyClockStatus(clockedIn: boolean, since?: string) {
    const existing = records.find((r) => r.name === currentUserName);
    if (existing) {
      return records.map((r) => (r.id === existing.id ? { ...r, clockedIn, since } : r));
    }
    return [...records, { id: newId("clock"), name: currentUserName, clockedIn, since }];
  }

  async function handleStart() {
    const punch: Punch = {
      id: newId("punch"),
      name: currentUserName,
      date: todayIso(),
      type: "shift",
      start: nowIso(),
    };
    await insertOpenPunch(app.id, punch);
    return onUpdate({
      punches: [...punches, punch],
      clockRecords: updateMyClockStatus(true, punch.start),
    });
  }

  function handleEnd() {
    if (!myOpenPunch) return;
    const closedOut = nowIso();
    const updatedPunches = punches.map((p) => (p.id === myOpenPunch.id ? { ...p, end: closedOut } : p));
    return onUpdate({
      punches: updatedPunches,
      clockRecords: updateMyClockStatus(false, undefined),
    });
  }

  async function handleStartBreak() {
    if (!myOpenPunch || myOpenPunch.type !== "shift") return;
    const now = nowIso();
    const punchesAfterClose = punches.map((p) => (p.id === myOpenPunch.id ? { ...p, end: now } : p));
    // Close the current shift first, awaited, so the "one open punch" slot is
    // empty before claiming it with a break -- never combined into one write.
    await onUpdate({ punches: punchesAfterClose });
    const breakPunch: Punch = {
      id: newId("punch"),
      name: currentUserName,
      date: myOpenPunch.date,
      type: "break",
      start: now,
    };
    await insertOpenPunch(app.id, breakPunch);
    return onUpdate({ punches: [...punchesAfterClose, breakPunch] });
  }

  function handleEndBreak() {
    if (!myOpenPunch || myOpenPunch.type !== "break") return;
    const closedAt = nowIso();
    const updatedPunches = punches.map((p) => (p.id === myOpenPunch.id ? { ...p, end: closedAt } : p));
    return onUpdate({ punches: updatedPunches });
  }

  const CONFIRM_COPY: Record<
    NonNullable<typeof confirmAction>,
    { title: string; message: string; confirmLabel: string }
  > = {
    start: { title: "Start shift?", message: "This will clock you in now.", confirmLabel: "Start" },
    end: { title: "End shift?", message: "This will clock you out now.", confirmLabel: "End" },
    startBreak: {
      title: "Start break?",
      message: "This will end your current shift and start a break.",
      confirmLabel: "Start break",
    },
    endBreak: { title: "End break?", message: "This will end your break.", confirmLabel: "End break" },
  };

  async function runConfirmedAction() {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    setClockBusy(true);
    try {
      if (action === "start") await handleStart();
      else if (action === "end") await handleEnd();
      else if (action === "startBreak") await handleStartBreak();
      else if (action === "endBreak") await handleEndBreak();
    } catch (err) {
      if (isOpenPunchConflict(err)) {
        toast.error("Already running elsewhere -- refreshing your status.");
      } else {
        console.error("Clock action failed:", err);
        toast.error("Couldn't save that. Please try again.");
      }
    } finally {
      setClockBusy(false);
    }
  }

  function handleRequestEdit(start: string | undefined, end: string | undefined, note: string) {
    if (!editingPunch || !start) return;
    const updatedPunches = punches.map((p) =>
      p.id === editingPunch.id ? { ...p, editRequest: { start, end, note: note || undefined, requestedAt: nowIso() } } : p,
    );
    onUpdate({ punches: updatedPunches });
    setEditingPunch(null);
  }

  function handleApproveEdit(punch: Punch) {
    if (!punch.editRequest) return;
    const { start, end } = punch.editRequest;
    const updatedPunches = punches.map((p) =>
      p.id === punch.id ? { ...p, start: start ?? p.start, end, editRequest: undefined } : p,
    );
    onUpdate({ punches: updatedPunches });
  }

  function handleRejectEdit(punch: Punch) {
    const updatedPunches = punches.map((p) => (p.id === punch.id ? { ...p, editRequest: undefined } : p));
    onUpdate({ punches: updatedPunches });
  }

  function handleAddRequest(record: TimeOffRequest) {
    onUpdate({ requests: [...requests, record] });
    setRequestType(null);
  }

  function openSelfRequest(type: RequestType) {
    setRequestEmployeeName(currentUserName);
    setRequestDate(undefined);
    setRequestType(type);
  }

  function openDayRequest(iso: string) {
    setRequestEmployeeName(viewingName);
    setRequestDate(iso);
    setRequestType("shift");
  }

  function handleReviewRequest(request: TimeOffRequest, status: "approved" | "denied") {
    onUpdate({ requests: requests.map((r) => (r.id === request.id ? { ...r, status } : r)) });
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

      <div className="clock-top-row">
        <div className="items-section clock-today-panel">
          <div className="clock-hero-col">
            <h2 className="items-section-title">Today's clock</h2>
            {myOpenPunch && myOpenPunch.date !== todayIso() && (
              <div className="clock-stale-banner">
                <Icon name="alert-circle" />
                <span>
                  You still have a {myOpenPunch.type} open from {formatDate(myOpenPunch.date)} — looks like you forgot
                  to end it.
                </span>
                <button type="button" className="btn-secondary-sm" onClick={() => setEditingPunch(myOpenPunch)}>
                  Fix it
                </button>
              </div>
            )}
            <div
              className={`clock-hero${myOpenPunch ? " clock-hero--active" : ""}${isBreakOpen ? " clock-hero--break" : ""}`}
            >
              <div className="clock-hero-top">
                <span className="clock-hero-worktime">
                  {myOpenPunch ? (isBreakOpen ? "Break time on" : "Work time on") : "Ready to start your shift?"}
                  {myOpenPunch && <span className="clock-hero-type-pill">{isBreakOpen ? "Break" : "Shift"}</span>}
                </span>
                {myOpenPunch && <span className="clock-hero-since">since {formatTimeOfDay(myOpenPunch.start)}</span>}
              </div>
              <span className="clock-hero-timer">{myOpenPunch ? formatElapsed(myOpenPunch.start) : "00:00:00"}</span>
              <div className="clock-hero-footer">
                <span>Total work hours for {todayLabel}</span>
                <strong>{formatMsClock(todayWorkedMs)}</strong>
              </div>
            </div>
            <div className="clock-hero-buttons">
              {!myOpenPunch && (
                <button
                  type="button"
                  className="clock-hero-btn clock-hero-btn--main clock-hero-btn--start"
                  onClick={() => setConfirmAction("start")}
                  disabled={clockBusy}
                >
                  {clockBusy ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="clock" />}
                  {clockBusy ? "Saving…" : "Start"}
                </button>
              )}
              {myOpenPunch?.type === "shift" && (
                <>
                  <button
                    type="button"
                    className="clock-hero-btn clock-hero-btn--break"
                    onClick={() => setConfirmAction("startBreak")}
                    disabled={clockBusy}
                  >
                    {clockBusy ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="clock" />}
                    {clockBusy ? "Saving…" : "Start break"}
                  </button>
                  <button
                    type="button"
                    className="clock-hero-btn clock-hero-btn--main clock-hero-btn--end"
                    onClick={() => setConfirmAction("end")}
                    disabled={clockBusy}
                  >
                    {clockBusy ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="clock" />}
                    {clockBusy ? "Saving…" : "End"}
                  </button>
                </>
              )}
              {isBreakOpen && (
                <button
                  type="button"
                  className="clock-hero-btn clock-hero-btn--main clock-hero-btn--end"
                  onClick={() => setConfirmAction("endBreak")}
                  disabled={clockBusy}
                >
                  {clockBusy ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="clock" />}
                  {clockBusy ? "Saving…" : "End break"}
                </button>
              )}
            </div>
          </div>

          <div className="clock-today-divider" />

          <div className="clock-daylog-col">
            <h2 className="items-section-title">My day log</h2>
            <TodayLog punches={myTodayPunches} />
          </div>
        </div>

        <div className="items-section clock-requests-panel">
          <h2 className="items-section-title">Requests</h2>
          <div className="request-quick-actions">
            <button type="button" className="request-quick-btn" onClick={() => openSelfRequest("shift")}>
              <span className="request-quick-icon request-quick-icon--shift">
                <Icon name="plus" />
              </span>
              Add a shift request
            </button>
            <button type="button" className="request-quick-btn" onClick={() => openSelfRequest("break")}>
              <span className="request-quick-icon request-quick-icon--break">
                <Icon name="clock" />
              </span>
              Add a break request
            </button>
            <button type="button" className="request-quick-btn" onClick={() => openSelfRequest("absence")}>
              <span className="request-quick-icon request-quick-icon--absence">
                <Icon name="sun" />
              </span>
              Add an absence request
            </button>
          </div>

          {myRequests.length > 0 && (
            <div className="items-list request-list">
              {myRequests.map((r) => (
                <div className="items-row" key={r.id}>
                  <div className="items-row-text">
                    <span className="items-row-name">{REQUEST_TYPE_LABEL[r.type]} request</span>
                    <span className="items-row-desc">
                      {describeRequest(r)}
                      {r.note ? ` · "${r.note}"` : ""}
                    </span>
                  </div>
                  <span
                    className="status-pill"
                    style={{ background: REQUEST_STATUS_COLOR[r.status].bg, color: REQUEST_STATUS_COLOR[r.status].fg }}
                  >
                    {r.status === "pending" ? "Pending" : r.status === "approved" ? "Approved" : "Denied"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin && otherRecords.length > 0 && (
        <div className="timesheet-viewer">
          <label htmlFor="timesheetViewer">Viewing timesheet for</label>
          <select
            id="timesheetViewer"
            className="filter-select"
            value={viewingName}
            onChange={(e) => setViewingName(e.target.value)}
          >
            <option value={currentUserName}>{currentUserName} (You)</option>
            {otherRecords.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <TimesheetSection
        title={viewingName === currentUserName ? "My timesheet" : `${viewingName}'s timesheet`}
        personName={viewingName}
        punches={viewedPunches}
        onRequestEdit={setEditingPunch}
        onRequestForDay={openDayRequest}
      />

      {isAdmin && pendingPunches.length > 0 && (
        <div className="items-section">
          <h2 className="items-section-title">Pending time edits</h2>
          <div className="items-list">
            {pendingPunches.map((punch) => (
              <div className="items-row" key={punch.id}>
                <div className="items-row-text">
                  <span className="items-row-name">
                    {punch.name} · {formatDate(punch.date)} · {punch.type === "shift" ? "Shift" : "Break"}
                  </span>
                  <span className="items-row-desc">
                    Current: {formatTimeOfDay(punch.start)} –{" "}
                    {punch.end ? formatTimeOfDay(punch.end) : "In progress"}
                    {"  →  Requested: "}
                    {formatTimeOfDay(punch.editRequest?.start ?? punch.start)} –{" "}
                    {punch.editRequest?.end ? formatTimeOfDay(punch.editRequest.end) : "In progress"}
                  </span>
                  {punch.editRequest?.note && <span className="items-row-desc">"{punch.editRequest.note}"</span>}
                </div>
                <div className="items-row-manage items-row-manage--active">
                  <button type="button" className="btn-secondary-sm" onClick={() => handleRejectEdit(punch)}>
                    Reject
                  </button>
                  <button type="button" className="btn-primary-sm" onClick={() => handleApproveEdit(punch)}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && pendingRequests.length > 0 && (
        <div className="items-section">
          <h2 className="items-section-title">Pending requests</h2>
          <div className="items-list">
            {pendingRequests.map((r) => (
              <div className="items-row" key={r.id}>
                <div className="items-row-text">
                  <span className="items-row-name">
                    {r.employeeName} · {REQUEST_TYPE_LABEL[r.type]} request
                  </span>
                  <span className="items-row-desc">
                    {describeRequest(r)}
                    {r.note ? ` · "${r.note}"` : ""}
                  </span>
                </div>
                <div className="items-row-manage items-row-manage--active">
                  <button type="button" className="btn-secondary-sm" onClick={() => handleReviewRequest(r, "denied")}>
                    Deny
                  </button>
                  <button type="button" className="btn-primary-sm" onClick={() => handleReviewRequest(r, "approved")}>
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

      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction ? CONFIRM_COPY[confirmAction].title : ""}>
        {confirmAction && (
          <div className="form-card">
            <p className="form-hint">{CONFIRM_COPY[confirmAction].message}</p>
            <div className="form-buttons">
              <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={runConfirmedAction}>
                {CONFIRM_COPY[confirmAction].confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editingPunch} onClose={() => setEditingPunch(null)} title="Request a time edit">
        {editingPunch && (
          <PunchEditForm punch={editingPunch} onSave={handleRequestEdit} onCancel={() => setEditingPunch(null)} />
        )}
      </Modal>

      <Modal
        open={!!requestType}
        onClose={() => setRequestType(null)}
        title={requestType ? `${REQUEST_TYPE_LABEL[requestType]} request` : "Request"}
      >
        {requestType && (
          <RequestForm
            type={requestType}
            employeeName={requestEmployeeName}
            initialDate={requestDate}
            onSave={handleAddRequest}
            onCancel={() => setRequestType(null)}
          />
        )}
      </Modal>
    </div>
  );
}
