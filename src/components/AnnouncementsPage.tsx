import { useEffect, useMemo, useState } from "react";
import type { AnnouncementRecord, AppTile, Role } from "../types";
import { Icon } from "../icons";
import { formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { AnnouncementForm } from "./AnnouncementForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: AnnouncementRecord[]) => void;
  readIds: string[];
  onMarkRead: (ids: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AnnouncementsPage({ app, role, onBack, onUpdate, readIds, onMarkRead }: Props) {
  const records = app.announcements ?? [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AnnouncementRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unreadIds = records.filter((r) => !readIds.includes(r.id)).map((r) => r.id);
    if (unreadIds.length > 0) onMarkRead(unreadIds);
    // only re-run when the set of announcements changes, not on every readIds/onMarkRead update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const sorted = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => [r.title, r.message, r.author].some((v) => v?.toLowerCase().includes(q)));
  }, [sorted, query]);

  function handleAddSave(record: AnnouncementRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: AnnouncementRecord) {
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
            placeholder="Search announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + New announcement
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No announcements yet." : "No announcements match your search."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((a) => (
            <div className="items-row announcement-row" key={a.id}>
              <div className="announcement-row-main">
                <div className="announcement-row-top">
                  <span className="items-row-name">
                    {!readIds.includes(a.id) && <span className="unread-dot" aria-label="Unread" />}
                    {a.title}
                  </span>
                  <span className="items-row-kind">{formatDate(a.date)}</span>
                </div>
                <p className="announcement-message">{a.message}</p>
                {a.author && <span className="items-row-desc">Posted by {a.author}</span>}
              </div>
              {canManage && (
                <div className={`items-row-manage${confirmDeleteId === a.id ? " items-row-manage--active" : ""}`}>
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => setEditing(a)}
                  >
                    <Icon name="edit" />
                  </button>
                  {confirmDeleteId === a.id ? (
                    <span className="confirm-delete">
                      <button type="button" className="btn-danger-sm" onClick={() => handleDelete(a.id)}>
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
                      aria-label={`Delete ${a.title}`}
                      onClick={() => setConfirmDeleteId(a.id)}
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

      <Modal open={adding} onClose={() => setAdding(false)} title="New announcement">
        <AnnouncementForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit announcement">
        {editing && (
          <AnnouncementForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
