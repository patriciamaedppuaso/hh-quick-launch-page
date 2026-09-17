import { useState } from "react";

interface Props {
  statuses: string[];
  usageCounts: Record<string, number>;
  minCount?: number;
  protectedNote?: string;
  onSave: (next: string[]) => void;
  onCancel: () => void;
}

export function ManageStatusesForm({ statuses, usageCounts, minCount = 1, protectedNote, onSave, onCancel }: Props) {
  const [items, setItems] = useState(statuses);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");

  function addStatus() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (items.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already exists.`);
      return;
    }
    setItems((prev) => [...prev, trimmed]);
    setNewLabel("");
    setError("");
  }

  function removeStatus(status: string) {
    if (usageCounts[status]) return;
    setItems((prev) => prev.filter((s) => s !== status));
    setError("");
  }

  function handleSave() {
    if (items.length < minCount) {
      setError(`Keep at least ${minCount} status${minCount === 1 ? "" : "es"}.`);
      return;
    }
    onSave(items);
  }

  return (
    <div className="form-card">
      {items.length > 0 && (
        <div className="attachment-list">
          {items.map((status) => {
            const count = usageCounts[status] ?? 0;
            const blocked = count > 0;
            return (
              <div className="attachment-chip" key={status}>
                <span className="attachment-name">{status}</span>
                <button
                  type="button"
                  className="icon-btn-sm"
                  aria-label={`Remove ${status}`}
                  title={blocked ? `In use by ${count} — reassign those first` : "Remove"}
                  disabled={blocked}
                  onClick={() => removeStatus(status)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="form-row">
        <label htmlFor="newStatusLabel">Add a status</label>
        <div className="url-field">
          <input
            id="newStatusLabel"
            type="text"
            placeholder="e.g. Blocked"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStatus();
              }
            }}
          />
          <button type="button" className="btn-secondary-sm" onClick={addStatus}>
            Add
          </button>
        </div>
      </div>

      {protectedNote && <p className="form-hint">{protectedNote}</p>}
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
