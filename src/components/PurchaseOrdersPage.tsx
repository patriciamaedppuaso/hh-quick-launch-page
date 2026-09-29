import { useMemo, useState } from "react";
import type { AppTile, PurchaseOrderRecord, Role } from "../types";
import { Icon } from "../icons";
import { canManageApp, initialOf, isPdfFile, openTarget } from "../utils";
import { Modal } from "./Modal";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { ManageStatusesForm } from "./ManageStatusesForm";
import { FilePreviewModal } from "./FilePreviewModal";
import { AddMenuButton } from "./AddMenuButton";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: PurchaseOrderRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EAF1FD", fg: "#4472C4" };

type StatusFilter = "all" | PurchaseOrderRecord["status"];

export function PurchaseOrdersPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.purchaseOrders ?? [];
  const folderOptions = app.statusOptions ?? [];
  const hasFolders = folderOptions.length > 0;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [editing, setEditing] = useState<PurchaseOrderRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<"invoice" | "folder">("invoice");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PurchaseOrderRecord | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;
  const showFolders = openFolder === null && hasFolders;

  const folderUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const po of records) {
      if (po.folder) counts[po.folder] = (counts[po.folder] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const visiblePOs = useMemo(() => {
    if (openFolder !== null) return records.filter((po) => po.folder === openFolder);
    if (hasFolders) return records.filter((po) => !po.folder);
    return records;
  }, [records, openFolder, hasFolders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visiblePOs.filter((po) => {
      if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (!q) return true;
      return po.name.toLowerCase().includes(q);
    });
  }, [visiblePOs, query, statusFilter]);

  function handleAddSave(record: PurchaseOrderRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: PurchaseOrderRecord) {
    onUpdate(records.map((po) => (po.id === record.id ? record : po)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((po) => po.id !== id));
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

  function renderPORow(po: PurchaseOrderRecord) {
    const canPreview = !!po.isFile && isPdfFile(po.fileName, po.url);
    const url = po.url;
    return (
      <div className="items-row" key={po.id}>
        <span className="items-row-icon">
          <Icon name="file" />
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{po.name}</span>
        </div>
        <span className={`equipment-pill equipment-pill--${po.status === "paid" ? "returned" : "ongoing"}`}>
          {po.status === "paid" ? "Paid" : "Unpaid"}
        </span>
        <div className="items-row-actions">
          {url ? (
            canPreview ? (
              <>
                <button type="button" className="list-item-open" onClick={() => setPreviewItem(po)}>
                  View
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => openTarget(url, po.isFile, po.fileName)}
                >
                  Download
                </button>
              </>
            ) : (
              <button type="button" className="list-item-open" onClick={() => openTarget(url, po.isFile, po.fileName)}>
                {po.isFile ? "Download" : "Open"}
              </button>
            )
          ) : (
            <span className="list-item-note">No file</span>
          )}
          {canManage && (
            <div className={`items-row-manage${confirmDeleteId === po.id ? " items-row-manage--active" : ""}`}>
              <button
                type="button"
                className="icon-btn-sm"
                aria-label={`Edit ${po.name}`}
                onClick={() => setEditing(po)}
              >
                <Icon name="edit" />
              </button>
              {confirmDeleteId === po.id ? (
                <span className="confirm-delete">
                  <button type="button" className="btn-danger-sm" onClick={() => handleDelete(po.id)}>
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
                  aria-label={`Delete ${po.name}`}
                  onClick={() => setConfirmDeleteId(po.id)}
                >
                  <Icon name="trash" />
                </button>
              )}
            </div>
          )}
        </div>
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
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        {canManage && (
          <AddMenuButton
            itemLabel="Invoice"
            onSelectItem={() => {
              setAddKind("invoice");
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
          {query || statusFilter !== "all"
            ? "No invoices match your filters."
            : openFolder !== null
              ? "No invoices in this folder yet."
              : "No invoices yet."}
        </p>
      ) : (
        <div className="items-list">
          {showFolders && folderOptions.map(renderFolderRow)}
          {filtered.map(renderPORow)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={addKind === "invoice" ? "Add invoice" : "Manage folders"}>
        {addKind === "invoice" ? (
          <PurchaseOrderForm
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
            placeholder="e.g. Vendor Name"
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
          <PurchaseOrderForm
            initial={editing}
            folderOptions={hasFolders ? folderOptions : undefined}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {previewItem && (
        <FilePreviewModal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName}
          url={previewItem.url ?? ""}
        />
      )}
    </div>
  );
}
