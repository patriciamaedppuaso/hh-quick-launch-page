import { useState } from "react";
import type { AppTile } from "../types";

interface Props {
  app: AppTile;
  onSave: (patch: {
    name: string;
    description?: string;
    visible: boolean;
    showInNav: boolean;
    staffCanManage: boolean;
  }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EditAppForm({ app, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [visible, setVisible] = useState(app.visible !== false);
  const [showInNav, setShowInNav] = useState(app.showInNav ?? app.type === "list");
  const [staffCanManage, setStaffCanManage] = useState(app.staffCanManage ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

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
      visible,
      showInNav,
      staffCanManage,
    });
  }

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
        <label>Visibility</label>
        <div className="type-toggle" role="group" aria-label="Visibility">
          <button
            type="button"
            className={`type-btn${visible ? " active" : ""}`}
            onClick={() => setVisible(true)}
          >
            Visible to staff
          </button>
          <button
            type="button"
            className={`type-btn${!visible ? " active" : ""}`}
            onClick={() => setVisible(false)}
          >
            Hidden from staff
          </button>
        </div>
        <p className="form-hint">Admins always see every app. Hidden apps stay editable, just off staff's dashboard.</p>
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
          {app.type === "link"
            ? "Link apps aren't in the sidebar by default. Turning this on adds a shortcut there that opens the link directly."
            : "This app still shows on the dashboard grid either way -- this only controls the sidebar list."}
        </p>
      </div>

      {app.type === "list" && (
        <div className="form-row">
          <label>Staff permissions</label>
          <div className="type-toggle" role="group" aria-label="Staff permissions">
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
            Admins can always add, edit, and delete. This controls whether staff can too, or just view.
          </p>
        </div>
      )}

      <div className="danger-zone">
        <div>
          <p className="danger-zone-title">Delete this app</p>
          <p className="form-hint">This removes "{app.name}" and everything inside it for everyone. This can't be undone.</p>
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
