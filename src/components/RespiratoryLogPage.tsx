import { useMemo, useState } from "react";
import type { AppTile, RespiratoryPatientRecord, Role } from "../types";
import { Icon } from "../icons";
import { canManageApp, formatDate, initialOf, isOverdue } from "../utils";
import { Modal } from "./Modal";
import { RespiratoryPatientForm } from "./RespiratoryPatientForm";
import { ManageStatusesForm } from "./ManageStatusesForm";
import { AddMenuButton } from "./AddMenuButton";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: RespiratoryPatientRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EAF6F1", fg: "#2F9E76" };

export function RespiratoryLogPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.respiratoryPatients ?? [];
  const folderOptions = app.statusOptions ?? [];
  const hasFolders = folderOptions.length > 0;
  const [query, setQuery] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [logDateFilter, setLogDateFilter] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [editing, setEditing] = useState<RespiratoryPatientRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<"patient" | "folder">("patient");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;
  const showFolders = openFolder === null && hasFolders;

  const folderUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of records) {
      if (p.folder) counts[p.folder] = (counts[p.folder] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const visiblePatients = useMemo(() => {
    if (openFolder !== null) return records.filter((p) => p.folder === openFolder);
    if (hasFolders) return records.filter((p) => !p.folder);
    return records;
  }, [records, openFolder, hasFolders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visiblePatients.filter((p) => {
      if (dueDateFilter && p.dueDate !== dueDateFilter) return false;
      if (logDateFilter && p.logDate !== logDateFilter) return false;
      if (!q) return true;
      return [p.patientName, p.city].some((v) => v?.toLowerCase().includes(q));
    });
  }, [visiblePatients, query, dueDateFilter, logDateFilter]);

  function handleAddSave(record: RespiratoryPatientRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: RespiratoryPatientRecord) {
    onUpdate(records.map((p) => (p.id === record.id ? record : p)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  }

  function renderFolderRow(folder: string) {
    const count = folderUsageCounts[folder] ?? 0;
    return (
      <button type="button" className="items-row folder-row" key={folder} onClick={() => setOpenFolder(folder)}>
        <span className="items-row-icon items-row-icon--folder">
          <Icon name="folder" />
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{folder}</span>
        </div>
        <span className="items-row-kind">
          {count} {count === 1 ? "patient" : "patients"}
        </span>
        <span className="folder-row-chevron" aria-hidden="true">
          <Icon name="chevron-right" />
        </span>
      </button>
    );
  }

  function renderPatientRow(p: RespiratoryPatientRecord) {
    const overdue = isOverdue(p.dueDate) && p.equipment.some((e) => e.status === "ongoing");
    return (
      <div className="items-row" key={p.id}>
        <span className="contact-avatar" style={{ background: tint.bg, color: tint.fg }}>
          {initialOf(p.patientName)}
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{p.patientName}</span>
          <span className={`items-row-desc${overdue ? " task-overdue" : ""}`}>
            {[
              p.city,
              p.dueDate && `Due ${formatDate(p.dueDate)}`,
              p.logDate && `Logged ${formatDate(p.logDate)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {p.equipment.length > 0 && (
            <span className="items-row-desc" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
              {p.equipment.map((e) => (
                <span key={e.id} className={`equipment-pill equipment-pill--${e.status}`}>
                  {e.name} · {e.status === "ongoing" ? "Ongoing" : "Returned"}
                </span>
              ))}
            </span>
          )}
        </div>
        {canManage && (
          <div className={`items-row-manage${confirmDeleteId === p.id ? " items-row-manage--active" : ""}`}>
            <button
              type="button"
              className="icon-btn-sm"
              aria-label={`Edit ${p.patientName}`}
              onClick={() => setEditing(p)}
            >
              <Icon name="edit" />
            </button>
            {confirmDeleteId === p.id ? (
              <span className="confirm-delete">
                <button type="button" className="btn-danger-sm" onClick={() => handleDelete(p.id)}>
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
                aria-label={`Delete ${p.patientName}`}
                onClick={() => setConfirmDeleteId(p.id)}
              >
                <Icon name="trash" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="items-page">
      <button
        type="button"
        className="back-link"
        onClick={() => (openFolder !== null ? setOpenFolder(null) : onBack())}
      >
        <Icon name="arrow-left" />
        {openFolder !== null ? `Back to ${app.name}` : "Back to dashboard"}
      </button>

      <div className="items-page-head">
        <div className="badge items-page-badge" style={{ background: "var(--card-bg)", color: tint.fg }}>
          {openFolder !== null ? (
            <Icon name="folder" />
          ) : app.icon ? (
            <Icon name={app.icon} />
          ) : (
            <span className="badge-letter">{app.initial || initialOf(app.name)}</span>
          )}
        </div>
        <div>
          <h1 className="items-page-title">{openFolder !== null ? openFolder : app.name}</h1>
          {openFolder === null && app.description && <p className="items-page-desc">{app.description}</p>}
        </div>
      </div>

      <div className="items-toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search patients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="form-row" style={{ margin: 0 }}>
          <label htmlFor="rlDueFilter" className="form-hint" style={{ margin: 0 }}>
            Due date
          </label>
          <input
            id="rlDueFilter"
            type="date"
            className="filter-select"
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
          />
        </div>
        <div className="form-row" style={{ margin: 0 }}>
          <label htmlFor="rlLogFilter" className="form-hint" style={{ margin: 0 }}>
            Log date
          </label>
          <input
            id="rlLogFilter"
            type="date"
            className="filter-select"
            value={logDateFilter}
            onChange={(e) => setLogDateFilter(e.target.value)}
          />
        </div>
        {(dueDateFilter || logDateFilter) && (
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => {
              setDueDateFilter("");
              setLogDateFilter("");
            }}
          >
            Clear dates
          </button>
        )}
        {canManage && (
          <AddMenuButton
            itemLabel="Patient"
            onSelectItem={() => {
              setAddKind("patient");
              setAdding(true);
            }}
            onSelectFolder={() => {
              setAddKind("folder");
              setAdding(true);
            }}
          />
        )}
      </div>

      {filtered.length === 0 && !(showFolders && folderOptions.length > 0) ? (
        <p className="items-empty">
          {query || dueDateFilter || logDateFilter
            ? "No patients match your filters."
            : openFolder !== null
              ? "No patients in this folder yet."
              : "No patients yet."}
        </p>
      ) : (
        <div className="items-list">
          {showFolders && folderOptions.map(renderFolderRow)}
          {filtered.map(renderPatientRow)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={addKind === "patient" ? "Add patient" : "Manage folders"}>
        {addKind === "patient" ? (
          <RespiratoryPatientForm
            folderOptions={hasFolders ? folderOptions : undefined}
            defaultFolder={openFolder ?? undefined}
            onSave={handleAddSave}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <ManageStatusesForm
            statuses={folderOptions}
            usageCounts={folderUsageCounts}
            minCount={0}
            itemLabel="folder"
            placeholder="e.g. Home Health"
            onSave={(next) => {
              onUpdateStatusOptions(next);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit patient">
        {editing && (
          <RespiratoryPatientForm
            initial={editing}
            folderOptions={hasFolders ? folderOptions : undefined}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
