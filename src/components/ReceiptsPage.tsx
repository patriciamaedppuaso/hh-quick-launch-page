import { useMemo, useState } from "react";
import type { AppTile, ReceiptRecord, Role } from "../types";
import { Icon } from "../icons";
import { canManageApp, formatCurrency, initialOf, isImageFile, isPdfFile, openTarget, withUsedFolders } from "../utils";
import { deleteUploadedFile } from "../lib/uploads";
import { Modal } from "./Modal";
import { ReceiptForm } from "./ReceiptForm";
import { ManageStatusesForm } from "./ManageStatusesForm";
import { FilePreviewModal } from "./FilePreviewModal";
import { AddMenuButton } from "./AddMenuButton";
import { DetailModal } from "./DetailModal";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: ReceiptRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#FDEFE3", fg: "#C9793A" };

type StatusFilter = "all" | ReceiptRecord["status"];

export function ReceiptsPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.receipts ?? [];
  const folderOptions = useMemo(() => withUsedFolders(app.statusOptions ?? [], records), [app.statusOptions, records]);
  const hasFolders = folderOptions.length > 0;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReceiptRecord | null>(null);
  const [viewing, setViewing] = useState<ReceiptRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<"receipt" | "folder">("receipt");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ReceiptRecord | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;
  const showFolders = openFolder === null && hasFolders;

  const folderUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.folder) counts[r.folder] = (counts[r.folder] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const visibleReceipts = useMemo(() => {
    if (openFolder !== null) return records.filter((r) => r.folder === openFolder);
    if (hasFolders) return records.filter((r) => !r.folder);
    return records;
  }, [records, openFolder, hasFolders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleReceipts.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q);
    });
  }, [visibleReceipts, query, statusFilter]);

  const totalUnpaid = useMemo(
    () => records.filter((r) => r.status === "unpaid").reduce((sum, r) => sum + (r.amount ?? 0), 0),
    [records],
  );

  function handleAddSave(record: ReceiptRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: ReceiptRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    const record = records.find((r) => r.id === id);
    onUpdate(records.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
    if (record?.isFile) deleteUploadedFile(record.url);
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
          {count} {count === 1 ? "receipt" : "receipts"}
        </span>
        <span className="folder-row-chevron" aria-hidden="true">
          <Icon name="chevron-right" />
        </span>
      </button>
    );
  }

  function renderReceiptRow(r: ReceiptRecord) {
    const previewIsImage = !!r.isFile && isImageFile(r.fileName, r.url);
    const canPreview = !!r.isFile && (isPdfFile(r.fileName, r.url) || previewIsImage);
    const url = r.url;
    return (
      <div className="items-row items-row--clickable" key={r.id} onClick={() => setViewing(r)}>
        <span className="items-row-icon">
          <Icon name="receipt" />
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{r.name}</span>
          {r.amount != null && <span className="items-row-desc">{formatCurrency(r.amount)}</span>}
        </div>
        <span className={`equipment-pill equipment-pill--${r.status === "paid" ? "returned" : "ongoing"}`}>
          {r.status === "paid" ? "Paid" : "Unpaid"}
        </span>
        <div className="items-row-actions" onClick={(e) => e.stopPropagation()}>
          {url ? (
            canPreview ? (
              <>
                <button type="button" className="list-item-open" onClick={() => setPreviewItem(r)}>
                  View
                </button>
                <button type="button" className="btn-secondary-sm" onClick={() => openTarget(url, r.isFile, r.fileName)}>
                  Download
                </button>
              </>
            ) : (
              <button type="button" className="list-item-open" onClick={() => openTarget(url, r.isFile, r.fileName)}>
                {r.isFile ? "Download" : "Open"}
              </button>
            )
          ) : (
            <span className="list-item-note">No file</span>
          )}
          {canManage && (
            <div className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}>
              <button type="button" className="icon-btn-sm" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}>
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
    );
  }

  return (
    <div className="items-page">
      <button type="button" className="back-link" onClick={() => (openFolder !== null ? setOpenFolder(null) : onBack())}>
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
        {openFolder === null && totalUnpaid > 0 && (
          <div className="items-page-summary">
            <span className="items-page-summary-value">{formatCurrency(totalUnpaid)}</span>
            <span className="items-page-summary-label">
              unpaid across {records.filter((r) => r.status === "unpaid").length}{" "}
              receipt{records.filter((r) => r.status === "unpaid").length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <div className="items-toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input type="text" placeholder="Search receipts..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
            itemLabel="Receipt"
            onSelectItem={() => {
              setAddKind("receipt");
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
            ? "No receipts match your filters."
            : openFolder !== null
              ? "No receipts in this folder yet."
              : "No receipts yet."}
        </p>
      ) : (
        <div className="items-list">
          {showFolders && folderOptions.map(renderFolderRow)}
          {filtered.map(renderReceiptRow)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={addKind === "receipt" ? "Add receipt" : "Manage folders"}>
        {addKind === "receipt" ? (
          <ReceiptForm
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit receipt">
        {editing && (
          <ReceiptForm
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
          isImage={isImageFile(previewItem.fileName, previewItem.url)}
        />
      )}

      <DetailModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? "Receipt"}
        fields={[
          { label: "Folder", value: viewing?.folder },
          { label: "Amount", value: viewing?.amount != null ? formatCurrency(viewing.amount) : undefined },
          { label: "Status", value: viewing?.status === "paid" ? "Paid" : "Unpaid" },
          { label: "File name", value: viewing?.fileName },
          { label: "Link", value: !viewing?.isFile ? viewing?.url : undefined },
          {
            label: "Receipt",
            value:
              viewing?.isFile && viewing.url ? (
                isImageFile(viewing.fileName, viewing.url) ? (
                  <img src={viewing.url} alt={viewing.fileName || "Receipt"} className="detail-file-preview" />
                ) : isPdfFile(viewing.fileName, viewing.url) ? (
                  <iframe
                    src={viewing.url}
                    title={viewing.fileName || "Receipt"}
                    className="detail-file-preview detail-file-preview--pdf"
                  />
                ) : undefined
              ) : undefined,
          },
        ]}
        onEdit={
          canManage && viewing
            ? () => {
                setEditing(viewing);
                setViewing(null);
              }
            : undefined
        }
      />
    </div>
  );
}
