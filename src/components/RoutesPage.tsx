import { useEffect, useMemo, useState } from "react";
import type { AppTile, Role, RouteStopRecord } from "../types";
import { Icon } from "../icons";
import { addDaysIso, canManageApp, initialOf, todayIso } from "../utils";
import { Modal } from "./Modal";
import { RouteStopForm } from "./RouteStopForm";
import { PersonSearchInput } from "./PersonSearchInput";
import { DetailModal } from "./DetailModal";
import { useIsMobile } from "../hooks/useIsMobile";

interface Props {
  app: AppTile;
  role: Role;
  currentUserName: string;
  registeredUserNames: string[];
  onBack: () => void;
  onUpdate: (records: RouteStopRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#E8F3EA", fg: "#3F9142" };

export function RoutesPage({ app, role, currentUserName, registeredUserNames, onBack, onUpdate }: Props) {
  const records = app.routeStops ?? [];
  const [driver, setDriver] = useState(() =>
    registeredUserNames.includes(currentUserName) ? currentUserName : (registeredUserNames[0] ?? ""),
  );
  const [date, setDate] = useState(todayIso());
  const [editing, setEditing] = useState<RouteStopRecord | null>(null);
  const [viewing, setViewing] = useState<RouteStopRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const isMobile = useIsMobile();
  const canReorder = canManage && !isMobile;
  const tint = app.tint ?? FALLBACK_TINT;

  // known drivers = registered users, plus anyone logged on a past route
  // who might not be a registered user (e.g. a contractor)
  const driverOptions = useMemo(() => {
    const names = new Set(registeredUserNames);
    for (const r of records) names.add(r.driver);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [registeredUserNames, records]);

  useEffect(() => {
    if (!driver && driverOptions.length > 0) setDriver(driverOptions[0]);
  }, [driver, driverOptions]);

  const stopsForDay = useMemo(
    () => records.filter((r) => r.driver === driver && r.date === date),
    [records, driver, date],
  );

  const totals = useMemo(() => {
    let mileage = 0;
    let flagged = 0;
    let finished = 0;
    for (const r of stopsForDay) {
      mileage += r.mileage ?? 0;
      if (r.flagged) flagged += 1;
      if (r.finished) finished += 1;
    }
    return { stops: stopsForDay.length, mileage, flagged, finished };
  }, [stopsForDay]);

  function handleAddSave(record: RouteStopRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: RouteStopRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  }

  function toggleFinished(stop: RouteStopRecord) {
    onUpdate(records.map((r) => (r.id === stop.id ? { ...r, finished: !r.finished } : r)));
  }

  function moveToNextDay(stop: RouteStopRecord) {
    onUpdate(records.map((r) => (r.id === stop.id ? { ...r, date: addDaysIso(r.date, 1) } : r)));
  }

  function handleReorder(nextStopsForDay: RouteStopRecord[]) {
    const otherRecords = records.filter((r) => !(r.driver === driver && r.date === date));
    onUpdate([...otherRecords, ...nextStopsForDay]);
  }

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      const fromIndex = stopsForDay.findIndex((r) => r.id === draggedId);
      const toIndex = stopsForDay.findIndex((r) => r.id === targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const next = [...stopsForDay];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        handleReorder(next);
      }
    }
    setDraggedId(null);
    setOverId(null);
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

      <div className="items-toolbar">
        <div className="form-row" style={{ margin: 0, minWidth: 220 }}>
          <PersonSearchInput
            value={driver}
            onChange={setDriver}
            options={driverOptions}
            placeholder="Search drivers..."
          />
        </div>
        <input
          type="date"
          className="filter-select"
          aria-label="Select date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add stop
          </button>
        )}
      </div>

      {!driver ? (
        <p className="items-empty">Search for a driver above to see their route.</p>
      ) : (
        <>
          <div className="rp-totals">
            <span className="rp-total">
              <span className="rp-total-label">Stops</span>
              <span className="rp-total-value">{totals.stops}</span>
            </span>
            <span className="rp-total">
              <span className="rp-total-label">Mileage</span>
              <span className="rp-total-value">{totals.mileage} mi</span>
            </span>
            <span className="rp-total rp-total--receivable">
              <span className="rp-total-label">Finished</span>
              <span className="rp-total-value">
                {totals.finished}/{totals.stops}
              </span>
            </span>
            {totals.flagged > 0 && (
              <span className="rp-total rp-total--payable">
                <span className="rp-total-label">Flagged</span>
                <span className="rp-total-value">{totals.flagged}</span>
              </span>
            )}
          </div>

          {stopsForDay.length === 0 ? (
            <p className="items-empty">No stops logged for {driver} on this date yet.</p>
          ) : (
            <div className="items-list">
              {stopsForDay.map((r) => (
                <div
                  className={`items-row items-row--clickable${r.flagged ? " items-row--flagged" : ""}${
                    draggedId === r.id ? " dragging" : ""
                  }${overId === r.id && draggedId && draggedId !== r.id ? " drag-over" : ""}`}
                  key={r.id}
                  onClick={() => setViewing(r)}
                  draggable={canReorder}
                  onDragStart={() => setDraggedId(r.id)}
                  onDragOver={(e) => {
                    if (!draggedId) return;
                    e.preventDefault();
                    if (overId !== r.id) setOverId(r.id);
                  }}
                  onDragLeave={() => setOverId((cur) => (cur === r.id ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(r.id);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setOverId(null);
                  }}
                >
                  {canReorder && (
                    <span className="drag-handle" aria-hidden="true" title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                      <Icon name="grip" />
                    </span>
                  )}
                  {canManage && (
                    <input
                      type="checkbox"
                      className="route-finished-checkbox"
                      checked={r.finished ?? false}
                      aria-label={r.finished ? `Mark ${r.customerName} as unfinished` : `Mark ${r.customerName} as finished`}
                      title={r.finished ? "Finished" : "Mark as finished"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleFinished(r)}
                    />
                  )}
                  {r.flagged && (
                    <span className="items-row-icon items-row-icon--flag">
                      <Icon name="alert-circle" />
                    </span>
                  )}
                  <div className="items-row-text">
                    <span className={`items-row-name${r.finished ? " task-done" : ""}`}>{r.customerName}</span>
                    <span className="items-row-desc">
                      {[r.street, r.city, r.startTime && `${r.startTime}${r.endTime ? `–${r.endTime}` : ""}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {(r.servicePerformed || r.note || r.driverEta || r.scheduleEta) && (
                      <span className="items-row-desc">
                        {[
                          r.servicePerformed,
                          r.driverEta && `ETA ${r.driverEta}`,
                          r.scheduleEta && `Scheduled ${r.scheduleEta}`,
                          r.note,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                  <div className="items-row-actions">
                    {r.mileage != null && <span className="items-row-kind">{r.mileage} mi</span>}
                    {canManage && !r.finished && (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveToNextDay(r);
                        }}
                        title={`Move to ${addDaysIso(r.date, 1)}`}
                      >
                        Next day
                      </button>
                    )}
                    {canManage && (
                      <div
                        className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="icon-btn-sm"
                          aria-label={`Edit ${r.customerName}`}
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
                            aria-label={`Delete ${r.customerName}`}
                            onClick={() => setConfirmDeleteId(r.id)}
                          >
                            <Icon name="trash" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add stop">
        <RouteStopForm
          driverOptions={driverOptions}
          defaultDriver={driver}
          defaultDate={date}
          onSave={handleAddSave}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit stop">
        {editing && (
          <RouteStopForm
            initial={editing}
            driverOptions={driverOptions}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <DetailModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.customerName ?? "Stop"}
        fields={[
          { label: "Driver", value: viewing?.driver },
          { label: "Date", value: viewing?.date },
          {
            label: "Time",
            value: viewing?.startTime ? `${viewing.startTime}${viewing.endTime ? `–${viewing.endTime}` : ""}` : undefined,
          },
          { label: "Mileage", value: viewing?.mileage != null ? `${viewing.mileage} mi` : undefined },
          { label: "Street", value: viewing?.street },
          { label: "City", value: viewing?.city },
          { label: "Driver's ETA", value: viewing?.driverEta },
          { label: "Schedule ETA", value: viewing?.scheduleEta },
          { label: "Service performed", value: viewing?.servicePerformed },
          { label: "Note", value: viewing?.note },
          { label: "Flagged", value: viewing?.flagged ? "Yes -- issue reported" : undefined },
          { label: "Finished", value: viewing?.finished ? "Yes" : "No" },
        ]}
        onEdit={
          canManage && viewing
            ? () => {
                setEditing(viewing);
                setViewing(null);
              }
            : undefined
        }
      />
    </div>
  );
}
