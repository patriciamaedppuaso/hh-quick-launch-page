import { useState } from "react";
import type { Role, UserProfile } from "../types";

interface Props {
  user: UserProfile;
  onSave: (patch: { name?: string; role?: Role }) => Promise<void>;
  onCancel: () => void;
}

export function UserEditForm({ user, onSave, onCancel }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSubmitting(true);
    setError("");
    try {
      await onSave({ name: name.trim() || undefined, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label>Email</label>
        <input type="email" value={user.email} disabled />
      </div>
      <div className="form-row">
        <label htmlFor="ueName">Name (optional)</label>
        <input
          id="ueName"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="ueRole">Role</label>
        <select id="ueRole" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="employee">Staff</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
