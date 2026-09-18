import { useState } from "react";
import type { ReceivablePayableRecord, RpKind } from "../types";
import { newId, todayIso } from "../utils";

interface Props {
  initial?: ReceivablePayableRecord;
  statusOptions: string[];
  onSave: (record: ReceivablePayableRecord) => void;
  onCancel: () => void;
}

export function ReceivablePayableForm({ initial, statusOptions, onSave, onCancel }: Props) {
  const [kind, setKind] = useState<RpKind>(initial?.kind ?? "receivable");
  const [party, setParty] = useState(initial?.party ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [status, setStatus] = useState(initial?.status ?? statusOptions[0]);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmedParty = party.trim();
    if (!trimmedParty) {
      setError(kind === "receivable" ? "Customer is required." : "Vendor is required.");
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount) : NaN;
    if (Number.isNaN(parsedAmount)) {
      setError("Amount is required and must be a number.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("rp"),
      kind,
      party: trimmedParty,
      amount: parsedAmount,
      status,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? todayIso(),
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label>Type</label>
        <div className="type-toggle" role="group" aria-label="Type">
          <button
            type="button"
            className={`type-btn${kind === "receivable" ? " active" : ""}`}
            onClick={() => setKind("receivable")}
          >
            Receivable
          </button>
          <button
            type="button"
            className={`type-btn${kind === "payable" ? " active" : ""}`}
            onClick={() => setKind("payable")}
          >
            Payable
          </button>
        </div>
        <p className="form-hint">
          {kind === "receivable" ? "Money a customer owes us." : "Money we owe a vendor."}
        </p>
      </div>
      <div className="form-row">
        <label htmlFor="rpParty">{kind === "receivable" ? "Customer" : "Vendor"}</label>
        <input
          id="rpParty"
          type="text"
          placeholder={kind === "receivable" ? "Who owes us?" : "Who do we owe?"}
          value={party}
          onChange={(e) => setParty(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rpAmount">Amount</label>
        <input
          id="rpAmount"
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rpStatus">Status</label>
        <select id="rpStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="rpDue">Due date (optional)</label>
        <input id="rpDue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rpNotes">Notes (optional)</label>
        <input
          id="rpNotes"
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
