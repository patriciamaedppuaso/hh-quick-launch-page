import { useState } from "react";
import { generatePassword } from "../utils";

interface Props {
  userEmail: string;
  onSave: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function ResetPasswordForm({ userEmail, onSave, onCancel }: Props) {
  const [password, setPassword] = useState(() => generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset the password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <p className="form-hint">
        This sets {userEmail}'s password right away. Share it with them directly (chat, in person) and have them
        change it after signing in.
      </p>
      <div className="form-row">
        <label htmlFor="rpPassword">New password</label>
        <div className="url-field">
          <input
            id="rpPassword"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="btn-secondary-sm" onClick={() => setPassword(generatePassword())}>
            Regenerate
          </button>
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </div>
    </div>
  );
}
