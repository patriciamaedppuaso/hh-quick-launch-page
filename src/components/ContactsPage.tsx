import { useMemo, useState } from "react";
import type { AppTile, ContactRecord, Role } from "../types";
import { Icon } from "../icons";
import { initialOf } from "../utils";
import { Modal } from "./Modal";
import { ContactForm } from "./ContactForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: ContactRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function ContactsPage({ app, role, onBack, onUpdate }: Props) {
  const records = app.contacts ?? [];
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ContactRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.name, r.role, r.phone, r.email, r.notes].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [records, query]);

  function handleAddSave(record: ContactRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: ContactRecord) {
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
            placeholder="Search contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add contact
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No contacts yet." : "No contacts match your search."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => (
            <div className="items-row" key={r.id}>
              <span className="contact-avatar" style={{ background: tint.bg, color: tint.fg }}>
                {r.avatar ? <img src={r.avatar} alt="" /> : initialOf(r.name)}
              </span>
              <div className="items-row-text">
                <span className="items-row-name">{r.name}</span>
                {r.role && <span className="items-row-desc">{r.role}</span>}
              </div>
              <div className="items-row-actions">
                {r.phone && (
                  <a className="list-item-open" href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>
                    <Icon name="phone" />
                    {r.phone}
                  </a>
                )}
                {r.email && (
                  <a className="list-item-open list-item-open-icon" href={`mailto:${r.email}`} aria-label={`Email ${r.name}`}>
                    <Icon name="mail" />
                  </a>
                )}
                {!r.phone && !r.email && <span className="list-item-note">No contact info</span>}
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
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add contact">
        <ContactForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit contact">
        {editing && <ContactForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
