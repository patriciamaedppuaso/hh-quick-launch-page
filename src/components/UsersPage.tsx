import { useEffect, useMemo, useState } from "react";
import type { AppTile, Role, UserProfile } from "../types";
import { Icon } from "../icons";
import { createUserAccount, deleteUser, fetchUsers, updateUserProfile } from "../lib/users";
import { formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { UserCreateForm } from "./UserCreateForm";
import { UserEditForm } from "./UserEditForm";
import { useToast } from "./ToastProvider";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
}

const FALLBACK_TINT = { bg: "#EFEFFB", fg: "#6C63C6" };

export function UsersPage({ app, role, onBack }: Props) {
  const toast = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  async function reload() {
    const next = await fetchUsers();
    setUsers(next);
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    reload()
      .catch((err) => setLoadErr(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.name, u.email].some((v) => v?.toLowerCase().includes(q)));
  }, [users, query]);

  async function handleCreate(input: { email: string; password: string; name?: string; role: Role }) {
    try {
      await createUserAccount(input);
      await reload();
      setCreating(false);
      toast.success("Account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the account.");
      throw err;
    }
  }

  async function handleEditSave(id: string, patch: { name?: string; role?: Role }) {
    try {
      await updateUserProfile(id, patch);
      await reload();
      setEditing(null);
      toast.success("User updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save changes.");
      throw err;
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteUser(id);
      await reload();
      setConfirmDeleteId(null);
      toast.success("User removed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't remove that user.";
      setLoadErr(message);
      toast.error(message);
    } finally {
      setBusyId(null);
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

      {!isAdmin ? (
        <p className="items-empty">Only admins can manage user accounts.</p>
      ) : loading ? (
        <p className="items-empty">Loading users…</p>
      ) : (
        <>
          {loadErr && <p className="field-error">{loadErr}</p>}

          <div className="items-toolbar">
            <div className="search-field">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primary items-add-btn" onClick={() => setCreating(true)}>
              + Add user
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="items-empty">{users.length === 0 ? "No users yet." : "No users match your search."}</p>
          ) : (
            <div className="items-list">
              {filtered.map((u) => (
                <div className="items-row" key={u.id}>
                  <span className="contact-avatar" style={{ background: tint.bg, color: tint.fg }}>
                    {initialOf(u.name || u.email)}
                  </span>
                  <div className="items-row-text">
                    <span className="items-row-name">{u.name || u.email}</span>
                    <span className="items-row-desc">
                      {u.name ? `${u.email} · ` : ""}
                      {u.lastSignInAt ? `Active since ${formatDate(u.lastSignInAt.slice(0, 10))}` : "Hasn't signed in yet"}
                    </span>
                  </div>
                  <span className="status-pill" style={{ background: "var(--surface-soft)", color: "var(--text-secondary)" }}>
                    {u.role === "admin" ? "Administrator" : "Staff"}
                  </span>
                  <div
                    className={`items-row-manage${confirmDeleteId === u.id ? " items-row-manage--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Edit ${u.email}`}
                      onClick={() => setEditing(u)}
                      disabled={busyId === u.id}
                    >
                      <Icon name="edit" />
                    </button>
                    {confirmDeleteId === u.id ? (
                      <span className="confirm-delete">
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => handleDelete(u.id)}
                          disabled={busyId === u.id}
                        >
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
                        aria-label={`Delete ${u.email}`}
                        onClick={() => setConfirmDeleteId(u.id)}
                        disabled={busyId === u.id}
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add user">
        <UserCreateForm onSave={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit user">
        {editing && (
          <UserEditForm
            user={editing}
            onSave={(patch) => handleEditSave(editing.id, patch)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
