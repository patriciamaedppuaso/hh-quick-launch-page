import { useMemo, useState } from "react";
import type { ListApp, ListItem, Role } from "../types";
import { Icon } from "../icons";
import { initialOf, openTarget } from "../utils";
import { Modal } from "./Modal";
import { ItemForm } from "./ItemForm";

interface Props {
  app: ListApp;
  role: Role;
  onBack: () => void;
  onUpdateItems: (items: ListItem[]) => void;
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

export function ItemsPage({ app, role, onBack, onUpdateItems }: Props) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return app.items.filter((item) => {
      if (kindFilter !== "all" && kindOf(item) !== kindFilter) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
    });
  }, [app.items, query, kindFilter]);

  function handleAddSave(item: ListItem) {
    onUpdateItems([...app.items, item]);
    setAddingItem(false);
  }

  function handleEditSave(item: ListItem) {
    onUpdateItems(app.items.map((it) => (it.id === item.id ? item : it)));
    setEditingItem(null);
  }

  function handleDelete(id: string) {
    onUpdateItems(app.items.filter((it) => it.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="items-page">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="arrow-left" />
        Back to dashboard
      </button>

      <div className="items-page-head">
        <div className="badge items-page-badge" style={{ background: "var(--card-bg)", color: tint.fg }}>
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
            placeholder="Search items..."
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
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAddingItem(true)}>
            + Add item
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {app.items.length === 0 ? "No items yet." : "No items match your search."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((item) => (
            <div className="items-row" key={item.id}>
              <div className="items-row-text">
                <span className="items-row-name">{item.name}</span>
                {item.description && <span className="items-row-desc">{item.description}</span>}
              </div>
              <span className="items-row-kind">{item.isFile ? "File" : item.url ? "Link" : "—"}</span>
              <div className="items-row-actions">
                {item.url ? (
                  <button
                    type="button"
                    className="list-item-open"
                    onClick={() => openTarget(item.url, item.isFile, item.fileName)}
                  >
                    {item.isFile ? "Download" : "Open"}
                  </button>
                ) : (
                  <span className="list-item-note">No link</span>
                )}
                {canManage && (
                  <div
                    className={`items-row-manage${confirmDeleteId === item.id ? " items-row-manage--active" : ""}`}
                  >
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
          ))}
        </div>
      )}

      <Modal open={addingItem} onClose={() => setAddingItem(false)} title="Add item">
        <ItemForm onSave={handleAddSave} onCancel={() => setAddingItem(false)} />
      </Modal>

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit item">
        {editingItem && (
          <ItemForm initial={editingItem} onSave={handleEditSave} onCancel={() => setEditingItem(null)} />
        )}
      </Modal>
    </div>
  );
}
