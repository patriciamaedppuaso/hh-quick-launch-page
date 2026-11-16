import { useState } from "react";
import type { Punch } from "../types";
import { fromDateTimeLocal, toDateTimeLocal } from "../utils";

interface Props {
  punch: Punch;
  onSave: (start: string | undefined, end: string | undefined, note: string) => void;
  onCancel: () => void;
}

export function PunchEditForm({ punch, onSave, onCancel }: Props) {
  const [start, setStart] = useState(toDateTimeLocal(punch.editRequest?.start ?? punch.start));
  const [end, setEnd] = useState(toDateTimeLocal(punch.editRequest?.end ?? punch.end));
  const [note, setNote] = useState(punch.editRequest?.note ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    if (!start) {
      setError(`${punch.type === "shift" ? "Start" : "Break start"} time is required.`);
      return;
    }
    if (end && end < start) {
      setError("End can't be before start.");
      return;
    }
    setError("");
    onSave(fromDateTimeLocal(start), end ? fromDateTimeLocal(end) : undefined, note.trim());
  }

  return (
    <div className="form-card">
      <p className="form-hint">
        Changes are sent to an admin for approval and won&apos;t apply until they&apos;re accepted.
      </p>
      <div className="form-row">
        <label htmlFor="peStart">{punch.type === "shift" ? "Clock in" : "Break start"}</label>
        <input id="peStart" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="peEnd">{punch.type === "shift" ? "Clock out" : "Break end"}</label>
        <input id="peEnd" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="peNote">Note for admin (optional)</label>
        <textarea
          id="peNote"
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
