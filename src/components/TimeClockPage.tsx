import { useMemo, useState } from "react";
import type { AppTile, ClockRecord, Role } from "../types";
import { Icon } from "../icons";
import { formatTimeOfDay, initialOf, nowIso } from "../utils";
import { Modal } from "./Modal";
import { TimeClockForm } from "./TimeClockForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: ClockRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function TimeClockPage({ app, role, onBack, onUpdate }: Props) {
  const records = app.clockRecords ?? [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClockRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.name.toLowerCase().includes(q));
  }, [records, query]);

  function toggleClock(record: ClockRecord) {
    const clockingIn = !record.clockedIn;
    onUpdate(
      records.map((r) =>
        r.id === record.id ? { ...r, clockedIn: clockingIn, since: clockingIn ? nowIso() : undefined } : r,
      ),
    );
  }

  function handleAddSave(record: ClockRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: ClockRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((r) => r.id !== id));
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
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add staff
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">{records.length === 0 ? "No staff yet." : "No staff match your search."}</p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => (
            <div className="items-row" key={r.id}>
              <button
                type="button"
                className={`task-check task-check--${r.clockedIn ? "done" : "todo"}`}
                onClick={() => toggleClock(r)}
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
              {canManage && (
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
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add staff">
        <TimeClockForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit staff">
        {editing && <TimeClockForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
