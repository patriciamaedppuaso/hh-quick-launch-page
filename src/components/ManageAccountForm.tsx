import { useState } from "react";

interface Props {
  email: string;
  name: string;
  onSave: (patch: { name?: string; password?: string }) => Promise<void>;
  onCancel: () => void;
}

export function ManageAccountForm({ email, name, onSave, onCancel }: Props) {
  const [nameValue, setNameValue] = useState(name);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }

    const trimmedName = nameValue.trim();
    const patch: { name?: string; password?: string } = {};
    if (trimmedName !== name) patch.name = trimmedName;
    if (newPassword) patch.password = newPassword;

    if (!patch.name && !patch.password) {
      onCancel();
      return;
    }

    setSubmitting(true);
    try {
      await onSave(patch);
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
        <input type="email" value={email} disabled />
      </div>
      <div className="form-row">
        <label htmlFor="maName">Name</label>
        <input
          id="maName"
          type="text"
          placeholder="Full name"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="maNewPassword">New password (optional)</label>
        <input
          id="maNewPassword"
          type="password"
          placeholder="Leave blank to keep current password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      {newPassword && (
        <div className="form-row">
          <label htmlFor="maConfirmPassword">Confirm new password</label>
          <input
            id="maConfirmPassword"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      )}
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
