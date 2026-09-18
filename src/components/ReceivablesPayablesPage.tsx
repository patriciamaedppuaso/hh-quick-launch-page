import { useMemo, useState } from "react";
import type { AppTile, ReceivablePayableRecord, Role, RpKind } from "../types";
import { Icon } from "../icons";
import { DEFAULT_RP_STATUSES, colorForStatus, formatCurrency, formatDate, initialOf, isOverdue } from "../utils";
import { Modal } from "./Modal";
import { ReceivablePayableForm } from "./ReceivablePayableForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: ReceivablePayableRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#FBEAEA", fg: "#B94A4A" };

type KindFilter = "all" | RpKind;

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "receivable", label: "Receivable" },
  { value: "payable", label: "Payable" },
];

export function ReceivablesPayablesPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.receivablesPayables ?? [];
  const statusOptions = app.statusOptions ?? DEFAULT_RP_STATUSES;
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<ReceivablePayableRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingStatuses, setManagingStatuses] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const statusUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [records]);

  const totals = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const r of records) {
      if (r.kind === "receivable") receivable += r.amount;
      else payable += r.amount;
    }
    return { receivable, payable };
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.party, r.notes].some((v) => v?.toLowerCase().includes(q));
    });
  }, [records, query, kindFilter, statusFilter]);

  function handleAddSave(record: ReceivablePayableRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: ReceivablePayableRecord) {
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

      <div className="rp-totals">
        <span className="rp-total rp-total--receivable">
          <span className="rp-total-label">Total receivable</span>
          <span className="rp-total-value">{formatCurrency(totals.receivable)}</span>
        </span>
        <span className="rp-total rp-total--payable">
          <span className="rp-total-label">Total payable</span>
          <span className="rp-total-value">{formatCurrency(totals.payable)}</span>
        </span>
      </div>

      <div className="items-toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search by customer/vendor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="type-toggle" role="group" aria-label="Filter by type">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`type-btn${kindFilter === f.value ? " active" : ""}`}
              onClick={() => setKindFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="filter-select"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {canManage && (
          <button
            type="button"
            className="card-edit-btn"
            aria-label="Manage statuses"
            title="Manage statuses"
            onClick={() => setManagingStatuses(true)}
          >
            <Icon name="edit" />
          </button>
        )}
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add entry
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No entries yet." : "No entries match your filters."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => {
            const overdue = isOverdue(r.dueDate);
            return (
              <div className="items-row" key={r.id}>
                <div className="items-row-text">
                  <span className="items-row-name">{r.party}</span>
                  <span className="items-row-desc">
                    {[r.dueDate && `Due ${formatDate(r.dueDate)}`, r.notes].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span className={`rp-kind-pill rp-kind-pill--${r.kind}`}>
                  {r.kind === "receivable" ? "Receivable" : "Payable"}
                </span>
                <span className={`items-row-kind${overdue ? " task-overdue" : ""}`}>{formatCurrency(r.amount)}</span>
                <span
                  className="status-pill"
                  style={{
                    background: colorForStatus(statusOptions, r.status).bg,
                    color: colorForStatus(statusOptions, r.status).fg,
                  }}
                >
                  {r.status}
                </span>
                {canManage && (
                  <div className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Edit ${r.party}`}
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
                        aria-label={`Delete ${r.party}`}
                        onClick={() => setConfirmDeleteId(r.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add entry">
        <ReceivablePayableForm statusOptions={statusOptions} onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit entry">
        {editing && (
          <ReceivablePayableForm
            initial={editing}
            statusOptions={statusOptions}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={managingStatuses} onClose={() => setManagingStatuses(false)} title="Manage statuses">
        <ManageStatusesForm
          statuses={statusOptions}
          usageCounts={statusUsageCounts}
          onSave={(next) => {
            onUpdateStatusOptions(next);
            setManagingStatuses(false);
          }}
          onCancel={() => setManagingStatuses(false)}
        />
      </Modal>
    </div>
  );
}
