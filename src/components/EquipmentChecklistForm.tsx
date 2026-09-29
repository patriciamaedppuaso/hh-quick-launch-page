import { useState } from "react";
import type { ChecklistItemEntry, EquipmentChecklistRecord } from "../types";
import { newId, todayIso } from "../utils";
import { PersonSearchInput } from "./PersonSearchInput";

interface Props {
  initial?: EquipmentChecklistRecord;
  checklistItems: string[];
  employeeOptions: string[];
  onAddChecklistItem: (item: string) => void;
  onSave: (record: EquipmentChecklistRecord) => void;
  onCancel: () => void;
}

export function EquipmentChecklistForm({
  initial,
  checklistItems,
  employeeOptions,
  onAddChecklistItem,
  onSave,
  onCancel,
}: Props) {
  const [employeeName, setEmployeeName] = useState(initial?.employeeName ?? "");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [confirmedItems, setConfirmedItems] = useState<ChecklistItemEntry[]>(initial?.confirmedItems ?? []);
  const [certified, setCertified] = useState(initial?.certified ?? false);
  const [newItemName, setNewItemName] = useState("");
  const [error, setError] = useState("");

  function isChecked(item: string) {
    return confirmedItems.some((e) => e.name === item);
  }

  function quantityFor(item: string) {
    return confirmedItems.find((e) => e.name === item)?.quantity ?? 1;
  }

  function toggleItem(item: string) {
    setConfirmedItems((prev) =>
      prev.some((e) => e.name === item) ? prev.filter((e) => e.name !== item) : [...prev, { name: item, quantity: 1 }],
    );
  }

  function setQuantity(item: string, quantity: number) {
    setConfirmedItems((prev) => prev.map((e) => (e.name === item ? { ...e, quantity } : e)));
  }

  function addNewItem() {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    const existing = checklistItems.find((i) => i.toLowerCase() === trimmed.toLowerCase());
    const name = existing ?? trimmed;
    if (!existing) onAddChecklistItem(trimmed);
    setConfirmedItems((prev) => (prev.some((e) => e.name === name) ? prev : [...prev, { name, quantity: 1 }]));
    setNewItemName("");
  }

  function handleSave() {
    const trimmedName = employeeName.trim();
    if (!trimmedName) {
      setError("Employee name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("checklist"),
      employeeName: trimmedName,
      date,
      confirmedItems,
      certified,
    });
  }

  const missingCount = checklistItems.filter((item) => !isChecked(item)).length;

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="ecEmployee">Employee name</label>
        <PersonSearchInput
          id="ecEmployee"
          value={employeeName}
          onChange={setEmployeeName}
          options={employeeOptions}
          placeholder="Search people..."
        />
      </div>
      <div className="form-row">
        <label htmlFor="ecDate">Date and time of inspection</label>
        <input id="ecDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="checklist-label-row">
          <label>List to be checked and confirmed daily before departure from office</label>
          <span className="checklist-select-actions">
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => setConfirmedItems(checklistItems.map((name) => ({ name, quantity: 1 })))}
            >
              Select all
            </button>
            <button type="button" className="btn-secondary-sm" onClick={() => setConfirmedItems([])}>
              Unselect all
            </button>
          </span>
        </div>
        {missingCount > 0 && <p className="form-hint">{missingCount} item(s) unchecked -- not confirmed present.</p>}
        <div className="inspection-checklist">
          {checklistItems.map((item) => {
            const checked = isChecked(item);
            return (
              <div className="checklist-item-row" key={item}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={checked} onChange={() => toggleItem(item)} />
                  {item}
                </label>
                {checked && (
                  <input
                    type="number"
                    min={1}
                    className="checklist-item-qty"
                    aria-label={`Quantity for ${item}`}
                    value={quantityFor(item)}
                    onChange={(e) => setQuantity(item, Math.max(1, Number(e.target.value) || 1))}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="url-field" style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="Equipment not listed above..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewItem();
              }
            }}
          />
          <button type="button" className="btn-secondary-sm" onClick={addNewItem}>
            Add
          </button>
        </div>
      </div>

      <div className="form-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
          Employee signature -- I confirm the above list is accurate.
        </label>
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          {initial ? "Save" : "Submit"}
        </button>
      </div>
    </div>
  );
}
