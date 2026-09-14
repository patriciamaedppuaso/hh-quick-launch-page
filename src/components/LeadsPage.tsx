import { useMemo, useState } from "react";
import type { AppTile, LeadRecord, LeadStatus, Role } from "../types";
import { Icon } from "../icons";
import { formatCurrency, formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { LeadForm } from "./LeadForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: LeadRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

type StatusFilter = "all" | LeadStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const STATUS_COLORS: Record<LeadStatus, { bg: string; fg: string }> = {
  new: { bg: "var(--surface-soft)", fg: "var(--text-secondary)" },
  contacted: { bg: "#FCF0DC", fg: "#B9772E" },
  qualified: { bg: "#E7F6F8", fg: "#2E8B99" },
  won: { bg: "#E9F5EF", fg: "#3E9A6D" },
  lost: { bg: "#F6E2DD", fg: "#C05A4A" },
};

export function LeadsPage({ app, role, onBack, onUpdate }: Props) {
  const records = app.leads ?? [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<LeadRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.name, r.company, r.notes].some((v) => v?.toLowerCase().includes(q));
    });
  }, [records, query, statusFilter]);

  function handleAddSave(record: LeadRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: LeadRecord) {
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
            placeholder="Search leads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="type-toggle" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`type-btn${statusFilter === f.value ? " active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add lead
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No leads yet." : "No leads match your filters."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((lead) => (
            <div className="items-row" key={lead.id}>
              <div className="items-row-text">
                <span className="items-row-name">{lead.name}</span>
                <span className="items-row-desc">
                  {[lead.company, lead.followUp && `Follow up ${formatDate(lead.followUp)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {lead.value != null && <span className="items-row-kind">{formatCurrency(lead.value)}</span>}
              <span className="status-pill" style={{ background: STATUS_COLORS[lead.status].bg, color: STATUS_COLORS[lead.status].fg }}>
                {STATUS_LABEL[lead.status]}
              </span>
              {canManage && (
                <div className={`items-row-manage${confirmDeleteId === lead.id ? " items-row-manage--active" : ""}`}>
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label={`Edit ${lead.name}`}
                    onClick={() => setEditing(lead)}
                  >
                    <Icon name="edit" />
                  </button>
                  {confirmDeleteId === lead.id ? (
                    <span className="confirm-delete">
                      <button type="button" className="btn-danger-sm" onClick={() => handleDelete(lead.id)}>
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
                      aria-label={`Delete ${lead.name}`}
                      onClick={() => setConfirmDeleteId(lead.id)}
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

      <Modal open={adding} onClose={() => setAdding(false)} title="Add lead">
        <LeadForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit lead">
        {editing && <LeadForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
