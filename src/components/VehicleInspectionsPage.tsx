import { useMemo, useState } from "react";
import type { AppTile, Role, TripType, VehicleInspectionRecord } from "../types";
import { Icon } from "../icons";
import { DEFAULT_INSPECTION_ITEMS, canManageApp, formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { VehicleInspectionForm } from "./VehicleInspectionForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  registeredUserNames: string[];
  onBack: () => void;
  onUpdate: (records: VehicleInspectionRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EAF1FD", fg: "#3B6FB6" };

type TripFilter = "all" | TripType;

export function VehicleInspectionsPage({
  app,
  role,
  registeredUserNames,
  onBack,
  onUpdate,
  onUpdateStatusOptions,
}: Props) {
  const records = app.vehicleInspections ?? [];
  const checklistItems = app.statusOptions ?? DEFAULT_INSPECTION_ITEMS;
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [tripFilter, setTripFilter] = useState<TripFilter>("all");
  const [editing, setEditing] = useState<VehicleInspectionRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingChecklist, setManagingChecklist] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;

  const checklistUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      for (const item of r.defectiveItems) counts[item] = (counts[item] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const sorted = useMemo(() => [...records].sort((a, b) => (a.date < b.date ? 1 : -1)), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((r) => {
      if (dateFilter && r.date !== dateFilter) return false;
      if (tripFilter !== "all" && r.tripType !== tripFilter) return false;
      if (!q) return true;
      return [r.driverName, r.licensePlate, r.vehicle, r.location].some((v) => v?.toLowerCase().includes(q));
    });
  }, [sorted, query, dateFilter, tripFilter]);

  function handleAddSave(record: VehicleInspectionRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: VehicleInspectionRecord) {
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
            placeholder="Search reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="type-toggle" role="group" aria-label="Filter by trip type">
          {(["all", "pre_trip", "post_trip"] as TripFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`type-btn${tripFilter === v ? " active" : ""}`}
              onClick={() => setTripFilter(v)}
            >
              {v === "all" ? "All" : v === "pre_trip" ? "Pre-Trip" : "Post-Trip"}
            </button>
          ))}
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
            + Add report
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No inspection reports yet." : "No reports match your filters."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => (
            <div className={`items-row${r.defectiveItems.length > 0 ? " items-row--flagged" : ""}`} key={r.id}>
              {r.defectiveItems.length > 0 && (
                <span className="items-row-icon items-row-icon--flag">
                  <Icon name="alert-circle" />
                </span>
              )}
              <div className="items-row-text">
                <span className="items-row-name">{r.driverName}</span>
                <span className="items-row-desc">
                  {[
                    formatDate(r.date),
                    r.tripType === "pre_trip" ? "Pre-Trip" : "Post-Trip",
                    r.vehicle,
                    r.licensePlate && `Plate ${r.licensePlate}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {r.defectiveItems.length > 0 && (
                  <span className="items-row-desc">Defective: {r.defectiveItems.join(", ")}</span>
                )}
              </div>
              <span className={`equipment-pill equipment-pill--${r.conditionAcceptable ? "returned" : "ongoing"}`}>
                {r.conditionAcceptable ? "Acceptable" : "Not acceptable"}
              </span>
              {canManage && (
                <div className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}>
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label={`Edit report for ${r.driverName}`}
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
                      aria-label={`Delete report for ${r.driverName}`}
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

      <Modal open={adding} onClose={() => setAdding(false)} title="Add inspection report">
        <VehicleInspectionForm
          checklistItems={checklistItems}
          driverOptions={registeredUserNames}
          onSave={handleAddSave}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit inspection report">
        {editing && (
          <VehicleInspectionForm
            initial={editing}
            checklistItems={checklistItems}
            driverOptions={registeredUserNames}
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
          placeholder="e.g. Air Compressor"
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
