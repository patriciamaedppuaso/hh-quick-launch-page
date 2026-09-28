import { useState } from "react";
import type { InvoiceRecord, OrderType } from "../types";
import { ORDER_TYPES, newId, todayIso } from "../utils";

interface Props {
  initial?: InvoiceRecord;
  folderOptions?: string[];
  defaultFolder?: string;
  onSave: (record: InvoiceRecord) => void;
  onCancel: () => void;
}

export function InvoiceForm({ initial, folderOptions, defaultFolder, onSave, onCancel }: Props) {
  const [folder, setFolder] = useState(initial?.folder ?? defaultFolder ?? "");
  const [patientName, setPatientName] = useState(initial?.patientName ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [hospice, setHospice] = useState(initial?.hospice ?? "");
  const [orderType, setOrderType] = useState<OrderType>(initial?.orderType ?? "Delivery");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<InvoiceRecord["status"]>(initial?.status ?? "to_be_printed");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [error, setError] = useState("");

  function handleSave() {
    const trimmedName = patientName.trim();
    if (!trimmedName) {
      setError("Patient name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("invoice"),
      folder: folder || undefined,
      patientName: trimmedName,
      address: address.trim() || undefined,
      hospice: hospice.trim() || undefined,
      orderType,
      notes: notes.trim() || undefined,
      status,
      date,
    });
  }

  return (
    <div className="form-card">
      {folderOptions && folderOptions.length > 0 && (
        <div className="form-row">
          <label htmlFor="invFolder">Folder</label>
          <select id="invFolder" value={folder} onChange={(e) => setFolder(e.target.value)}>
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
        <label htmlFor="invName">Patient name</label>
        <input
          id="invName"
          type="text"
          placeholder="Full name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="invAddress">Address (optional)</label>
        <input id="invAddress" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="invHospice">Hospice (optional)</label>
        <input id="invHospice" type="text" value={hospice} onChange={(e) => setHospice(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="invOrderType">Order type</label>
        <select id="invOrderType" value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
          {ORDER_TYPES.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="invDate">Date</label>
        <input id="invDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Status</label>
        <div className="type-toggle" role="group" aria-label="Status">
          <button
            type="button"
            className={`type-btn${status === "to_be_printed" ? " active" : ""}`}
            onClick={() => setStatus("to_be_printed")}
          >
            To be printed
          </button>
          <button
            type="button"
            className={`type-btn${status === "printed" ? " active" : ""}`}
            onClick={() => setStatus("printed")}
          >
            Printed
          </button>
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="invNotes">Notes (optional)</label>
        <input
          id="invNotes"
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
