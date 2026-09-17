import { useMemo, useState } from "react";
import type { AppTile, ContactRecord, Role } from "../types";
import { Icon } from "../icons";
import { DEFAULT_CONTACT_CATEGORIES, colorForStatus, initialOf } from "../utils";
import { Modal } from "./Modal";
import { ContactForm } from "./ContactForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: ContactRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function ContactsPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.contacts ?? [];
  const categoryOptions = app.statusOptions ?? DEFAULT_CONTACT_CATEGORIES;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<ContactRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const categoryUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return [r.name, r.role, r.phone, r.email, r.notes].some((v) => v?.toLowerCase().includes(q));
    });
  }, [records, query, categoryFilter]);

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
        <select
          className="filter-select"
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {canManage && (
          <button
            type="button"
            className="card-edit-btn"
            aria-label="Manage categories"
            title="Manage categories"
            onClick={() => setManagingCategories(true)}
          >
            <Icon name="edit" />
          </button>
        )}
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
                {r.category && (
                  <span
                    className="status-pill"
                    style={{
                      background: colorForStatus(categoryOptions, r.category).bg,
                      color: colorForStatus(categoryOptions, r.category).fg,
                    }}
                  >
                    {r.category}
                  </span>
                )}
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
        <ContactForm categoryOptions={categoryOptions} onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit contact">
        {editing && (
          <ContactForm
            initial={editing}
            categoryOptions={categoryOptions}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={managingCategories} onClose={() => setManagingCategories(false)} title="Manage contact categories">
        <ManageStatusesForm
          statuses={categoryOptions}
          usageCounts={categoryUsageCounts}
          onSave={(next) => {
            onUpdateStatusOptions(next);
            setManagingCategories(false);
          }}
          onCancel={() => setManagingCategories(false)}
        />
      </Modal>
    </div>
  );
}
