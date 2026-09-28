import { useMemo, useState } from "react";
import type { AppTile, InvoiceRecord, Role } from "../types";
import { Icon } from "../icons";
import { canManageApp, formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { InvoiceForm } from "./InvoiceForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: InvoiceRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#FDF2E3", fg: "#C98A2E" };

type StatusFilter = "all" | InvoiceRecord["status"];

export function InvoicesPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.invoices ?? [];
  const folderOptions = app.statusOptions ?? [];
  const hasFolders = folderOptions.length > 0;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [editing, setEditing] = useState<InvoiceRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<"invoice" | "folder">("invoice");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;
  const showFolders = openFolder === null && hasFolders;

  const folderUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inv of records) {
      if (inv.folder) counts[inv.folder] = (counts[inv.folder] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const visibleInvoices = useMemo(() => {
    if (openFolder !== null) return records.filter((inv) => inv.folder === openFolder);
    if (hasFolders) return records.filter((inv) => !inv.folder);
    return records;
  }, [records, openFolder, hasFolders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleInvoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (monthFilter && !inv.date.startsWith(monthFilter)) return false;
      if (!q) return true;
      return [inv.patientName, inv.address, inv.hospice, inv.notes].some((v) => v?.toLowerCase().includes(q));
    });
  }, [visibleInvoices, query, statusFilter, monthFilter]);

  function handleAddSave(record: InvoiceRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: InvoiceRecord) {
    onUpdate(records.map((inv) => (inv.id === record.id ? record : inv)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((inv) => inv.id !== id));
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
          {count} {count === 1 ? "invoice" : "invoices"}
        </span>
        <span className="folder-row-chevron" aria-hidden="true">
          <Icon name="chevron-right" />
        </span>
      </button>
    );
  }

  function renderInvoiceRow(inv: InvoiceRecord) {
    return (
      <div className="items-row" key={inv.id}>
        <span className="contact-avatar" style={{ background: tint.bg, color: tint.fg }}>
          {initialOf(inv.patientName)}
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{inv.patientName}</span>
          <span className="items-row-desc">
            {[inv.hospice, inv.address, formatDate(inv.date)].filter(Boolean).join(" · ")}
          </span>
          {inv.notes && <span className="items-row-desc">{inv.notes}</span>}
        </div>
        <span className="items-row-kind">{inv.orderType}</span>
        <span className={`equipment-pill equipment-pill--${inv.status === "printed" ? "returned" : "ongoing"}`}>
          {inv.status === "printed" ? "Printed" : "To be printed"}
        </span>
        {canManage && (
          <div className={`items-row-manage${confirmDeleteId === inv.id ? " items-row-manage--active" : ""}`}>
            <button
              type="button"
              className="icon-btn-sm"
              aria-label={`Edit ${inv.patientName}`}
              onClick={() => setEditing(inv)}
            >
              <Icon name="edit" />
            </button>
            {confirmDeleteId === inv.id ? (
              <span className="confirm-delete">
                <button type="button" className="btn-danger-sm" onClick={() => handleDelete(inv.id)}>
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
                aria-label={`Delete ${inv.patientName}`}
                onClick={() => setConfirmDeleteId(inv.id)}
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
            placeholder="Search invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="to_be_printed">To be printed</option>
          <option value="printed">Printed</option>
        </select>
        <input
          type="month"
          className="filter-select"
          aria-label="Filter by month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
        {monthFilter && (
          <button type="button" className="btn-secondary-sm" onClick={() => setMonthFilter("")}>
            Clear month
          </button>
        )}
        {canManage && (
          <button
            type="button"
            className="btn-primary items-add-btn"
            onClick={() => {
              setAddKind("invoice");
              setAdding(true);
            }}
          >
            + Add
          </button>
        )}
      </div>

      {filtered.length === 0 && !(showFolders && folderOptions.length > 0) ? (
        <p className="items-empty">
          {query || statusFilter !== "all" || monthFilter
            ? "No invoices match your filters."
            : openFolder !== null
              ? "No invoices in this folder yet."
              : "No invoices yet."}
        </p>
      ) : (
        <div className="items-list">
          {showFolders && folderOptions.map(renderFolderRow)}
          {filtered.map(renderInvoiceRow)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={addKind === "invoice" ? "Add invoice" : "Manage folders"}>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <label>Add</label>
          <div className="type-toggle" role="group" aria-label="Add">
            <button
              type="button"
              className={`type-btn${addKind === "invoice" ? " active" : ""}`}
              onClick={() => setAddKind("invoice")}
            >
              Invoice
            </button>
            <button
              type="button"
              className={`type-btn${addKind === "folder" ? " active" : ""}`}
              onClick={() => setAddKind("folder")}
            >
              Folder
            </button>
          </div>
        </div>
        {addKind === "invoice" ? (
          <InvoiceForm
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
            placeholder="e.g. Invoice"
            onSave={(next) => {
              onUpdateStatusOptions(next);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit invoice">
        {editing && (
          <InvoiceForm
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
