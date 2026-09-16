import { useState } from "react";
import type { Role } from "../types";
import { generatePassword } from "../utils";

interface Props {
  onSave: (input: { email: string; password: string; name?: string; role: Role }) => Promise<void>;
  onCancel: () => void;
}

export function UserCreateForm({ onSave, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [password, setPassword] = useState(() => generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave({ email: trimmedEmail, password, name: name.trim() || undefined, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <p className="form-hint">
        This creates the account right away with the password below. Share it with them directly (chat, in
        person) and have them change it after their first sign-in.
      </p>
      <div className="form-row">
        <label htmlFor="ucEmail">Email</label>
        <input
          id="ucEmail"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="ucName">Name (optional)</label>
        <input
          id="ucName"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="ucRole">Role</label>
        <select id="ucRole" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="employee">Staff</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="ucPassword">Temporary password</label>
        <div className="url-field">
          <input
            id="ucPassword"
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
          {submitting ? "Creating…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
