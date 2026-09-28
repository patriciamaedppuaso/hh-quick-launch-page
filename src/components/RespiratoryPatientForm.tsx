import { useState } from "react";
import type { RespiratoryEquipmentEntry, RespiratoryPatientRecord } from "../types";
import { newId, todayIso } from "../utils";

interface Props {
  initial?: RespiratoryPatientRecord;
  folderOptions?: string[];
  defaultFolder?: string;
  onSave: (record: RespiratoryPatientRecord) => void;
  onCancel: () => void;
}

export function RespiratoryPatientForm({ initial, folderOptions, defaultFolder, onSave, onCancel }: Props) {
  const [patientName, setPatientName] = useState(initial?.patientName ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [folder, setFolder] = useState(initial?.folder ?? defaultFolder ?? "");
  const [equipment, setEquipment] = useState<RespiratoryEquipmentEntry[]>(initial?.equipment ?? []);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [error, setError] = useState("");

  function addEquipment() {
    const trimmed = newEquipmentName.trim();
    if (!trimmed) return;
    setEquipment((prev) => [...prev, { id: newId("equip"), name: trimmed, status: "ongoing" }]);
    setNewEquipmentName("");
  }

  function removeEquipment(id: string) {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleEquipmentStatus(id: string) {
    setEquipment((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: e.status === "ongoing" ? "returned" : "ongoing" } : e)),
    );
  }

  function handleSave() {
    const trimmedName = patientName.trim();
    if (!trimmedName) {
      setError("Patient name is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("patient"),
      folder: folder || undefined,
      patientName: trimmedName,
      city: city.trim() || undefined,
      equipment,
      dueDate: dueDate || undefined,
      logDate: initial?.logDate ?? todayIso(),
    });
  }

  return (
    <div className="form-card">
      {folderOptions && folderOptions.length > 0 && (
        <div className="form-row">
          <label htmlFor="rpFolder">Folder</label>
          <select id="rpFolder" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">No folder</option>
            {folderOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-row">
        <label htmlFor="rpName">Patient name</label>
        <input
          id="rpName"
          type="text"
          placeholder="Full name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rpCity">City (optional)</label>
        <input id="rpCity" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rpDue">Due date (optional)</label>
        <input id="rpDue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Equipment</label>
        {equipment.length > 0 && (
          <div className="attachment-list">
            {equipment.map((e) => (
              <div className="attachment-chip" key={e.id}>
                <span className="attachment-name">{e.name}</span>
                <button
                  type="button"
                  className={`equipment-status-btn equipment-status-btn--${e.status}`}
                  onClick={() => toggleEquipmentStatus(e.id)}
                  title="Click to toggle status"
                >
                  {e.status === "ongoing" ? "Ongoing" : "Returned"}
                </button>
                <button
                  type="button"
                  className="icon-btn-sm"
                  aria-label={`Remove ${e.name}`}
                  onClick={() => removeEquipment(e.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="url-field">
          <input
            type="text"
            placeholder="e.g. Oxygen Concentrator"
            value={newEquipmentName}
            onChange={(e) => setNewEquipmentName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEquipment();
              }
            }}
          />
          <button type="button" className="btn-secondary-sm" onClick={addEquipment}>
            Add
          </button>
        </div>
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
