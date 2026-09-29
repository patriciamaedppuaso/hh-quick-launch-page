import { useMemo, useState } from "react";
import type { AppTile, EquipmentChecklistRecord, Role } from "../types";
import { Icon } from "../icons";
import { DEFAULT_EQUIPMENT_CHECKLIST_ITEMS, canManageApp, formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { EquipmentChecklistForm } from "./EquipmentChecklistForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  registeredUserNames: string[];
  onBack: () => void;
  onUpdate: (records: EquipmentChecklistRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EAF6F1", fg: "#2F9E76" };

export function EquipmentChecklistsPage({
  app,
  role,
  registeredUserNames,
  onBack,
  onUpdate,
  onUpdateStatusOptions,
}: Props) {
  const records = app.equipmentChecklists ?? [];
  const checklistItems = app.statusOptions ?? DEFAULT_EQUIPMENT_CHECKLIST_ITEMS;
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editing, setEditing] = useState<EquipmentChecklistRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingChecklist, setManagingChecklist] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;

  const checklistUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      for (const item of r.confirmedItems) counts[item] = (counts[item] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const sorted = useMemo(() => [...records].sort((a, b) => (a.date < b.date ? 1 : -1)), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((r) => {
      if (dateFilter && r.date !== dateFilter) return false;
      if (!q) return true;
      return r.employeeName.toLowerCase().includes(q);
    });
  }, [sorted, query, dateFilter]);

  function handleAddSave(record: EquipmentChecklistRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: EquipmentChecklistRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  }

  function handleAddChecklistItem(item: string) {
    if (checklistItems.some((i) => i.toLowerCase() === item.toLowerCase())) return;
    onUpdateStatusOptions([...checklistItems, item]);
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
            placeholder="Search by employee..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <input
          type="date"
          className="filter-select"
          aria-label="Filter by date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {dateFilter && (
          <button type="button" className="btn-secondary-sm" onClick={() => setDateFilter("")}>
            Clear date
          </button>
        )}
        {canManage && (
          <button
            type="button"
            className="card-edit-btn"
            aria-label="Manage checklist"
            title="Manage checklist"
            onClick={() => setManagingChecklist(true)}
          >
            <Icon name="edit" />
          </button>
        )}
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add log
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">{records.length === 0 ? "No checklist logs yet." : "No logs match your filters."}</p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => {
            const missing = checklistItems.filter((item) => !r.confirmedItems.includes(item));
            return (
              <div className={`items-row${missing.length > 0 ? " items-row--flagged" : ""}`} key={r.id}>
                {missing.length > 0 && (
                  <span className="items-row-icon items-row-icon--flag">
                    <Icon name="alert-circle" />
                  </span>
                )}
                <div className="items-row-text">
                  <span className="items-row-name">{r.employeeName}</span>
                  <span className="items-row-desc">{formatDate(r.date)}</span>
                  {missing.length > 0 && <span className="items-row-desc">Missing: {missing.join(", ")}</span>}
                </div>
                <span className={`equipment-pill equipment-pill--${missing.length === 0 ? "returned" : "ongoing"}`}>
                  {missing.length === 0 ? "All confirmed" : `${missing.length} missing`}
                </span>
                {canManage && (
                  <div className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Edit log for ${r.employeeName}`}
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
                        aria-label={`Delete log for ${r.employeeName}`}
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

      <Modal open={adding} onClose={() => setAdding(false)} title="Add checklist log">
        <EquipmentChecklistForm
          checklistItems={checklistItems}
          employeeOptions={registeredUserNames}
          onAddChecklistItem={handleAddChecklistItem}
          onSave={handleAddSave}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit checklist log">
        {editing && (
          <EquipmentChecklistForm
            initial={editing}
            checklistItems={checklistItems}
            employeeOptions={registeredUserNames}
            onAddChecklistItem={handleAddChecklistItem}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={managingChecklist} onClose={() => setManagingChecklist(false)} title="Manage checklist items">
        <ManageStatusesForm
          statuses={checklistItems}
          usageCounts={checklistUsageCounts}
          itemLabel="checklist item"
          placeholder="e.g. Wheelchair Ramp"
          onSave={(next) => {
            onUpdateStatusOptions(next);
            setManagingChecklist(false);
          }}
          onCancel={() => setManagingChecklist(false)}
        />
      </Modal>
    </div>
  );
}
