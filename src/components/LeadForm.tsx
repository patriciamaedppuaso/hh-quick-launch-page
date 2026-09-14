import { useState } from "react";
import type { LeadRecord, LeadStatus } from "../types";
import { newId } from "../utils";

interface Props {
  initial?: LeadRecord;
  onSave: (record: LeadRecord) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function LeadForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [status, setStatus] = useState<LeadStatus>(initial?.status ?? "new");
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : "");
  const [followUp, setFollowUp] = useState(initial?.followUp ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const parsedValue = value.trim() ? Number(value) : undefined;
    onSave({
      id: initial?.id ?? newId("lead"),
      name: trimmedName,
      company: company.trim() || undefined,
      status,
      value: parsedValue !== undefined && !Number.isNaN(parsedValue) ? parsedValue : undefined,
      followUp: followUp || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="lName">Name</label>
        <input
          id="lName"
          type="text"
          placeholder="Contact name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="lCompany">Company (optional)</label>
        <input
          id="lCompany"
          type="text"
          placeholder="Company or practice name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="lStatus">Status</label>
        <select id="lStatus" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="lValue">Est. value (optional)</label>
        <input
          id="lValue"
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="lFollowUp">Follow-up date (optional)</label>
        <input id="lFollowUp" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="lNotes">Notes (optional)</label>
        <input
          id="lNotes"
          type="text"
          placeholder="Anything worth remembering"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
