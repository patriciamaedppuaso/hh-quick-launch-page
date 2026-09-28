import { useMemo, useState } from "react";
import type { AccountRecord, AppTile, Role } from "../types";
import { Icon } from "../icons";
import { DEFAULT_ACCOUNT_CATEGORIES, canManageApp, colorForStatus, initialOf } from "../utils";
import { Modal } from "./Modal";
import { AccountForm } from "./AccountForm";
import { ManageStatusesForm } from "./ManageStatusesForm";
import { useToast } from "./ToastProvider";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: AccountRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EFECFB", fg: "#7C6FE0" };

export function AccountsPage({ app, role, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const toast = useToast();
  const records = app.accounts ?? [];
  const categoryOptions = app.statusOptions ?? DEFAULT_ACCOUNT_CATEGORIES;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<AccountRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;

  const categoryUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1;
    }
    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.notes].some((v) => v?.toLowerCase().includes(q));
    });
  }, [records, query, categoryFilter]);

  function handleAddSave(record: AccountRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: AccountRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  }

  async function copyToClipboard(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Couldn't copy ${label.toLowerCase()}.`);
    }
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
            placeholder="Search accounts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {canManage && (
          <button
            type="button"
            className="card-edit-btn"
            aria-label="Manage categories"
            title="Manage categories"
            onClick={() => setManagingCategories(true)}
          >
            <Icon name="edit" />
          </button>
        )}
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add account
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No accounts yet." : "No accounts match your search."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((r) => {
            const revealed = revealedId === r.id;
            return (
              <div className="items-row" key={r.id}>
                <span className="contact-avatar" style={{ background: tint.bg, color: tint.fg }}>
                  {initialOf(r.name)}
                </span>
                <div className="items-row-text">
                  <span className="items-row-name">{r.name}</span>
                  <span className="items-row-desc account-email">
                    {r.email}
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Copy email for ${r.name}`}
                      title="Copy email"
                      onClick={() => copyToClipboard(r.email, "Email")}
                    >
                      <Icon name="copy" />
                    </button>
                  </span>
                </div>
                <div className="items-row-actions">
                  {r.category && (
                    <span
                      className="status-pill"
                      style={{
                        background: colorForStatus(categoryOptions, r.category).bg,
                        color: colorForStatus(categoryOptions, r.category).fg,
                      }}
                    >
                      {r.category}
                    </span>
                  )}
                  <span className="account-password">
                    <span className="account-password-value">{revealed ? r.password : "••••••••"}</span>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={revealed ? `Hide password for ${r.name}` : `Show password for ${r.name}`}
                      title={revealed ? "Hide password" : "Show password"}
                      onClick={() => setRevealedId(revealed ? null : r.id)}
                    >
                      <Icon name={revealed ? "eye-off" : "eye"} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Copy password for ${r.name}`}
                      title="Copy password"
                      onClick={() => copyToClipboard(r.password, "Password")}
                    >
                      <Icon name="copy" />
                    </button>
                  </span>
                  {r.url && (
                    <a
                      className="list-item-open list-item-open-icon"
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${r.name} login page`}
                      title="Open login page"
                    >
                      <Icon name="external-link" />
                    </a>
                  )}
                  {canManage && (
                    <div className={`items-row-manage${confirmDeleteId === r.id ? " items-row-manage--active" : ""}`}>
                      <button
                        type="button"
                        className="icon-btn-sm"
                        aria-label={`Edit ${r.name}`}
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
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add account">
        <AccountForm categoryOptions={categoryOptions} onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit account">
        {editing && (
          <AccountForm
            initial={editing}
            categoryOptions={categoryOptions}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={managingCategories} onClose={() => setManagingCategories(false)} title="Manage account categories">
        <ManageStatusesForm
          statuses={categoryOptions}
          usageCounts={categoryUsageCounts}
          itemLabel="category"
          placeholder="e.g. Shipping"
          onSave={(next) => {
            onUpdateStatusOptions(next);
            setManagingCategories(false);
          }}
          onCancel={() => setManagingCategories(false)}
        />
      </Modal>
    </div>
  );
}
