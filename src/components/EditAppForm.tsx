import { useState } from "react";
import type { AppTile, Role } from "../types";
import { SELECTABLE_ROLES, roleLabel } from "../utils";

interface Props {
  app: AppTile;
  onSave: (patch: {
    name: string;
    description?: string;
    visibleRoles?: Role[];
    showInNav: boolean;
    staffCanManage: boolean;
  }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EditAppForm({ app, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [visibleRoles, setVisibleRoles] = useState<Role[]>(app.visibleRoles ?? SELECTABLE_ROLES);
  const [showInNav, setShowInNav] = useState(app.showInNav ?? app.type === "list");
  const [staffCanManage, setStaffCanManage] = useState(app.staffCanManage ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: Role) {
    setVisibleRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    setError("");
    onSave({
      name: trimmedName,
      description: description.trim() || undefined,
      visibleRoles: visibleRoles.length === SELECTABLE_ROLES.length ? undefined : visibleRoles,
      showInNav,
      staffCanManage,
    });
  }

  const visibleRoleLabels = visibleRoles.map(roleLabel);

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="eaName">Name</label>
        <input id="eaName" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="eaDesc">Description (optional)</label>
        <input
          id="eaDesc"
          type="text"
          placeholder="What is this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Who can see this</label>
        <div className="type-toggle" role="group" aria-label="Who can see this">
          <span className="type-btn active type-btn--locked" title="Admins always see every app">
            Admin
          </span>
          {SELECTABLE_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`type-btn${visibleRoles.includes(role) ? " active" : ""}`}
              onClick={() => toggleRole(role)}
            >
              {roleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>Sidebar navigation</label>
        <div className="type-toggle" role="group" aria-label="Sidebar navigation">
          <button
            type="button"
            className={`type-btn${showInNav ? " active" : ""}`}
            onClick={() => setShowInNav(true)}
          >
            Show in nav
          </button>
          <button
            type="button"
            className={`type-btn${!showInNav ? " active" : ""}`}
            onClick={() => setShowInNav(false)}
          >
            Hide from nav
          </button>
        </div>
        <p className="form-hint">
          {app.type === "link" ? "Adds a sidebar shortcut that opens the link directly." : "Only affects the sidebar list, not the dashboard grid."}
        </p>
      </div>

      {app.type === "list" && visibleRoles.length > 0 && (
        <div className="form-row">
          <label>Permission</label>
          <div className="type-toggle" role="group" aria-label="Permission">
            <button
              type="button"
              className={`type-btn${!staffCanManage ? " active" : ""}`}
              onClick={() => setStaffCanManage(false)}
            >
              View only
            </button>
            <button
              type="button"
              className={`type-btn${staffCanManage ? " active" : ""}`}
              onClick={() => setStaffCanManage(true)}
            >
              Can add / edit / delete
            </button>
          </div>
          <p className="form-hint">
            Whether {visibleRoleLabels.join(" and ")} can {staffCanManage ? "add, edit, and delete" : "only view"}. Admins can always manage.
          </p>
        </div>
      )}

      <div className="danger-zone">
        <div>
          <p className="danger-zone-title">Delete this app</p>
          <p className="form-hint">This removes "{app.name}" and everything inside it. Can't be undone.</p>
        </div>
        {confirmingDelete ? (
          <span className="confirm-delete">
            <button type="button" className="btn-danger-sm" onClick={onDelete}>
              Delete
            </button>
            <button type="button" className="btn-secondary-sm" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="btn-danger-sm" onClick={() => setConfirmingDelete(true)}>
            Delete app
          </button>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
