import { useState } from "react";
import type { TimeEntry } from "../types";
import { fromDateTimeLocal, toDateTimeLocal } from "../utils";

interface Props {
  entry: TimeEntry;
  onSave: (clockIn: string | undefined, clockOut: string | undefined, note: string) => void;
  onCancel: () => void;
}

export function TimeEntryEditForm({ entry, onSave, onCancel }: Props) {
  const [clockIn, setClockIn] = useState(toDateTimeLocal(entry.editRequest?.clockIn ?? entry.clockIn));
  const [clockOut, setClockOut] = useState(toDateTimeLocal(entry.editRequest?.clockOut ?? entry.clockOut));
  const [note, setNote] = useState(entry.editRequest?.note ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    if (!clockIn) {
      setError("Clock in time is required.");
      return;
    }
    if (clockOut && clockOut < clockIn) {
      setError("Clock out can't be before clock in.");
      return;
    }
    setError("");
    onSave(fromDateTimeLocal(clockIn), clockOut ? fromDateTimeLocal(clockOut) : undefined, note.trim());
  }

  return (
    <div className="form-card">
      <p className="form-hint">
        Changes are sent to an admin for approval and won&apos;t apply until they&apos;re accepted.
      </p>
      <div className="form-row">
        <label htmlFor="teClockIn">Clock in</label>
        <input
          id="teClockIn"
          type="datetime-local"
          value={clockIn}
          onChange={(e) => setClockIn(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="teClockOut">Clock out</label>
        <input
          id="teClockOut"
          type="datetime-local"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="teNote">Note for admin (optional)</label>
        <textarea
          id="teNote"
          rows={3}
          placeholder="Why are you requesting this change?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Submit for approval
        </button>
      </div>
    </div>
  );
}
