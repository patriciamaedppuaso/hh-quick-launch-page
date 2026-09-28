import { useState } from "react";
import type { AccountRecord } from "../types";
import { Icon } from "../icons";
import { isValidEmail, newId, todayIso } from "../utils";

interface Props {
  initial?: AccountRecord;
  categoryOptions: string[];
  onSave: (record: AccountRecord) => void;
  onCancel: () => void;
}

export function AccountForm({ initial, categoryOptions, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? categoryOptions[0] ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Account name is required.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("account"),
      name: trimmedName,
      category: category || undefined,
      email: trimmedEmail,
      password,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: todayIso(),
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="acName">Account name</label>
        <input
          id="acName"
          type="text"
          placeholder="e.g. QuickBooks, Facebook Business"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="acCategory">Category</label>
        <select id="acCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="acEmail">Email</label>
        <input
          id="acEmail"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="acPassword">Password</label>
        <div className="url-field">
          <input
            id="acPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Account password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="acUrl">Login URL (optional)</label>
        <input
          id="acUrl"
          type="text"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="acNotes">Notes (optional)</label>
        <input
          id="acNotes"
          type="text"
          placeholder="Anything worth remembering"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </div>
  );
}
