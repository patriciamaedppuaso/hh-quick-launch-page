import { useState } from "react";
import type { AppTile } from "../types";

interface Props {
  app: AppTile;
  onSave: (patch: { name: string; description?: string; visible: boolean }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EditAppForm({ app, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [visible, setVisible] = useState(app.visible !== false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({ name: trimmedName, description: description.trim() || undefined, visible });
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
