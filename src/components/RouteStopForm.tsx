import { useState } from "react";
import type { RouteStopRecord } from "../types";
import { newId, todayIso } from "../utils";
import { PersonSearchInput } from "./PersonSearchInput";

interface Props {
  initial?: RouteStopRecord;
  driverOptions: string[];
  defaultDriver?: string;
  defaultDate?: string;
  onSave: (record: RouteStopRecord) => void;
  onCancel: () => void;
}

export function RouteStopForm({ initial, driverOptions, defaultDriver, defaultDate, onSave, onCancel }: Props) {
  const [driver, setDriver] = useState(initial?.driver ?? defaultDriver ?? "");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayIso());
  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [mileage, setMileage] = useState(initial?.mileage != null ? String(initial.mileage) : "");
  const [driverEta, setDriverEta] = useState(initial?.driverEta ?? "");
  const [scheduleEta, setScheduleEta] = useState(initial?.scheduleEta ?? "");
  const [servicePerformed, setServicePerformed] = useState(initial?.servicePerformed ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [flagged, setFlagged] = useState(initial?.flagged ?? false);
  const [error, setError] = useState("");

  function handleSave() {
    if (!driver.trim()) {
      setError("Driver is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError("Stop / customer name is required.");
      return;
    }
    const parsedMileage = mileage.trim() ? Number(mileage) : undefined;
    if (mileage.trim() && Number.isNaN(parsedMileage)) {
      setError("Mileage must be a number.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("stop"),
      driver: driver.trim(),
      date,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      mileage: parsedMileage,
      customerName: trimmedName,
      street: street.trim() || undefined,
      city: city.trim() || undefined,
      driverEta: driverEta.trim() || undefined,
      scheduleEta: scheduleEta.trim() || undefined,
      servicePerformed: servicePerformed.trim() || undefined,
      note: note.trim() || undefined,
      flagged,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="rsDriver">Driver</label>
        <PersonSearchInput
          id="rsDriver"
          value={driver}
          onChange={setDriver}
          options={driverOptions}
          placeholder="Search people..."
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsDate">Date</label>
        <input id="rsDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rsName">Stop / customer name</label>
        <input
          id="rsName"
          type="text"
          placeholder="e.g. Maria Torres, or OFFICE / GAS / LUNCH"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsStreet">Street (optional)</label>
        <input id="rsStreet" type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rsCity">City (optional)</label>
        <input id="rsCity" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rsStart">Start time (optional)</label>
        <input
          id="rsStart"
          type="text"
          placeholder="e.g. 11:10"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsEnd">End time (optional)</label>
        <input
          id="rsEnd"
          type="text"
          placeholder="e.g. 11:19"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsMileage">Mileage (optional)</label>
        <input id="rsMileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="rsDriverEta">Driver's ETA (optional)</label>
        <input
          id="rsDriverEta"
          type="text"
          placeholder="e.g. 35 mins"
          value={driverEta}
          onChange={(e) => setDriverEta(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsScheduleEta">Schedule ETA (optional)</label>
        <input
          id="rsScheduleEta"
          type="text"
          placeholder="e.g. 1-3PM"
          value={scheduleEta}
          onChange={(e) => setScheduleEta(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsService">Service performed (optional)</label>
        <input
          id="rsService"
          type="text"
          placeholder="e.g. P/U EQUIP"
          value={servicePerformed}
          onChange={(e) => setServicePerformed(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rsNote">Note (optional)</label>
        <input
          id="rsNote"
          type="text"
          placeholder="Anything worth remembering"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />
          Flag as issue (e.g. no one answered, not ready)
        </label>
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
