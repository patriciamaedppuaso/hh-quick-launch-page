import { useState } from "react";
import type { RequestType, TimeOffRequest } from "../types";
import { newId, nowIso, todayIso } from "../utils";

interface Props {
  type: RequestType;
  employeeName: string;
  onSave: (record: TimeOffRequest) => void;
  onCancel: () => void;
}

export function RequestForm({ type, employeeName, onSave, onCancel }: Props) {
  const [date, setDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (type !== "absence" && startTime && endTime && endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    setError("");
    onSave({
      id: newId("request"),
      employeeName,
      type,
      date,
      endDate: type === "absence" ? endDate || undefined : undefined,
      startTime: type !== "absence" ? startTime || undefined : undefined,
      endTime: type !== "absence" ? endTime || undefined : undefined,
      note: note.trim() || undefined,
      status: "pending",
      requestedAt: nowIso(),
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="reqDate">{type === "absence" ? "Start date" : "Date"}</label>
        <input id="reqDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {type === "absence" ? (
        <div className="form-row">
          <label htmlFor="reqEndDate">End date (optional)</label>
          <input id="reqEndDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <p className="form-hint">Leave blank for a single day.</p>
        </div>
      ) : (
        <>
          <div className="form-row">
            <label htmlFor="reqStart">Start time (optional)</label>
            <input id="reqStart" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="reqEnd">End time (optional)</label>
            <input id="reqEnd" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </>
      )}
      <div className="form-row">
        <label htmlFor="reqNote">{type === "absence" ? "Reason (optional)" : "Note (optional)"}</label>
        <textarea
          id="reqNote"
          rows={3}
          placeholder="Anything worth adding"
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
          Submit request
        </button>
      </div>
    </div>
  );
}
