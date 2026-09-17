import { useMemo, useState } from "react";
import type { ListApp, ListItem, Role } from "../types";
import { Icon } from "../icons";
import { formatDate, initialOf, isOverdue, isPdfFile, openTarget } from "../utils";
import { Modal } from "./Modal";
import { ItemForm } from "./ItemForm";
import { FilePreviewModal } from "./FilePreviewModal";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: ListApp;
  role: Role;
  onBack: () => void;
  onUpdateItems: (items: ListItem[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

type KindFilter = "all" | "link" | "file" | "none";

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "link", label: "Links" },
  { value: "file", label: "Files" },
  { value: "none", label: "No link" },
];

function kindOf(item: ListItem): KindFilter {
  if (item.isFile) return "file";
  if (item.url) return "link";
  return "none";
}

export function ItemsPage({ app, role, onBack, onUpdateItems, onUpdateStatusOptions }: Props) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<"item" | "folder">("item");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ListItem | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;
  const folderOptions = app.statusOptions ?? [];
  const hasFolders = folderOptions.length > 0;
  const showFolders = openFolder === null && hasFolders;

  const folderUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of app.items) {
      if (it.folder) counts[it.folder] = (counts[it.folder] ?? 0) + 1;
    }
    return counts;
  }, [app.items]);

  const visibleItems = useMemo(() => {
    if (openFolder !== null) return app.items.filter((it) => it.folder === openFolder);
    if (hasFolders) return app.items.filter((it) => !it.folder);
    return app.items;
  }, [app.items, openFolder, hasFolders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleItems.filter((item) => {
      if (kindFilter !== "all" && kindOf(item) !== kindFilter) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
    });
  }, [visibleItems, query, kindFilter]);

  function handleAddSave(item: ListItem) {
    onUpdateItems([...app.items, item]);
    setAdding(false);
  }

  function handleEditSave(item: ListItem) {
    onUpdateItems(app.items.map((it) => (it.id === item.id ? item : it)));
    setEditingItem(null);
  }

  function handleDelete(id: string) {
    onUpdateItems(app.items.filter((it) => it.id !== id));
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
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="folder-row-chevron" aria-hidden="true">
          <Icon name="chevron-right" />
        </span>
      </button>
    );
  }

  function renderRow(item: ListItem) {
    return (
      <div className="items-row" key={item.id}>
        <span className="items-row-icon">
          <Icon name="file" />
        </span>
        <div className="items-row-text">
          <span className="items-row-name">{item.name}</span>
          {(item.description || item.expiresOn) && (
            <span className={`items-row-desc${isOverdue(item.expiresOn) ? " task-overdue" : ""}`}>
              {[item.description, item.expiresOn && `Expires ${formatDate(item.expiresOn)}`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
        <span className="items-row-kind">{item.isFile ? "File" : item.url ? "Link" : "—"}</span>
        <div className="items-row-actions">
          {item.url ? (
            item.isFile && isPdfFile(item.fileName, item.url) ? (
              <>
                <button type="button" className="list-item-open" onClick={() => setPreviewItem(item)}>
                  View
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => openTarget(item.url, item.isFile, item.fileName)}
                >
                  Download
                </button>
              </>
            ) : (
              <button
                type="button"
                className="list-item-open"
                onClick={() => openTarget(item.url, item.isFile, item.fileName)}
              >
                {item.isFile ? "Download" : "Open"}
              </button>
            )
          ) : (
            <span className="list-item-note">No link</span>
          )}
          {canManage && (
            <div className={`items-row-manage${confirmDeleteId === item.id ? " items-row-manage--active" : ""}`}>
              <button
                type="button"
                className="icon-btn-sm"
                aria-label={`Edit ${item.name}`}
                onClick={() => setEditingItem(item)}
              >
                <Icon name="edit" />
              </button>
              {confirmDeleteId === item.id ? (
                <span className="confirm-delete">
                  <button type="button" className="btn-danger-sm" onClick={() => handleDelete(item.id)}>
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
                  aria-label={`Delete ${item.name}`}
                  onClick={() => setConfirmDeleteId(item.id)}
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
            placeholder={openFolder !== null ? `Search in ${openFolder}...` : "Search items..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="type-toggle" role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
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
        {canManage && (
          <button
            type="button"
            className="btn-primary items-add-btn"
            onClick={() => {
              setAddKind("item");
              setAdding(true);
            }}
          >
            + Add
          </button>
        )}
      </div>

      {filtered.length === 0 && !(showFolders && folderOptions.length > 0) ? (
        <p className="items-empty">
          {query || kindFilter !== "all"
            ? "No items match your search."
            : openFolder !== null
              ? "No items in this folder yet."
              : "No items yet."}
        </p>
      ) : (
        <div className="items-list">
          {showFolders && folderOptions.map(renderFolderRow)}
          {filtered.map(renderRow)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={addKind === "item" ? "Add item" : "Manage folders"}>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <label>Add</label>
          <div className="type-toggle" role="group" aria-label="Add">
            <button
              type="button"
              className={`type-btn${addKind === "item" ? " active" : ""}`}
              onClick={() => setAddKind("item")}
            >
              Item
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
        {addKind === "item" ? (
          <ItemForm
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
            placeholder="e.g. Contracts"
            onSave={(next) => {
              onUpdateStatusOptions(next);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </Modal>

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit item">
        {editingItem && (
          <ItemForm
            initial={editingItem}
            folderOptions={hasFolders ? folderOptions : undefined}
            onSave={handleEditSave}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      {previewItem && (
        <FilePreviewModal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName}
          url={previewItem.url}
        />
      )}
    </div>
  );
}
