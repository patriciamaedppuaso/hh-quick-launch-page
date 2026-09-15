import { useState } from "react";
import type { ClockRecord } from "../types";
import { newId } from "../utils";

interface Props {
  initial?: ClockRecord;
  onSave: (record: ClockRecord) => void;
  onCancel: () => void;
}

export function TimeClockForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      id: initial?.id ?? newId("clock"),
      name: trimmed,
      clockedIn: initial?.clockedIn ?? false,
      since: initial?.since,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="tcName">Staff name</label>
        <input
          id="tcName"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
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
