import { useState } from "react";
import type { TripType, VehicleInspectionRecord } from "../types";
import { newId, todayIso } from "../utils";
import { PersonSearchInput } from "./PersonSearchInput";

interface Props {
  initial?: VehicleInspectionRecord;
  checklistItems: string[];
  driverOptions: string[];
  onSave: (record: VehicleInspectionRecord) => void;
  onCancel: () => void;
}

export function VehicleInspectionForm({ initial, checklistItems, driverOptions, onSave, onCancel }: Props) {
  const [driverName, setDriverName] = useState(initial?.driverName ?? "");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "pre_trip");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [licensePlate, setLicensePlate] = useState(initial?.licensePlate ?? "");
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? "");
  const [odometer, setOdometer] = useState(initial?.odometer != null ? String(initial.odometer) : "");
  const [defectiveItems, setDefectiveItems] = useState<string[]>(initial?.defectiveItems ?? []);
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [conditionAcceptable, setConditionAcceptable] = useState(initial?.conditionAcceptable ?? true);
  const [certified, setCertified] = useState(initial?.certified ?? false);
  const [error, setError] = useState("");

  function toggleDefect(item: string) {
    setDefectiveItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  }

  function handleSave() {
    const trimmedDriver = driverName.trim();
    if (!trimmedDriver) {
      setError("Driver's full name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    const parsedOdometer = odometer.trim() ? Number(odometer) : undefined;
    if (odometer.trim() && Number.isNaN(parsedOdometer)) {
      setError("Odometer reading must be a number.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("inspection"),
      driverName: trimmedDriver,
      date,
      tripType,
      location: location.trim() || undefined,
      licensePlate: licensePlate.trim() || undefined,
      vehicle: vehicle.trim() || undefined,
      odometer: parsedOdometer,
      defectiveItems,
      remarks: remarks.trim() || undefined,
      conditionAcceptable,
      certified,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="viDriver">Driver's full name</label>
        <PersonSearchInput
          id="viDriver"
          value={driverName}
          onChange={setDriverName}
          options={driverOptions}
          placeholder="Search people..."
        />
      </div>
      <div className="form-row">
        <label htmlFor="viDate">Date</label>
        <input id="viDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Pre-Trip or Post-Trip?</label>
        <div className="type-toggle" role="group" aria-label="Trip type">
          <button
            type="button"
            className={`type-btn${tripType === "pre_trip" ? " active" : ""}`}
            onClick={() => setTripType("pre_trip")}
          >
            Pre-Trip
          </button>
          <button
            type="button"
            className={`type-btn${tripType === "post_trip" ? " active" : ""}`}
            onClick={() => setTripType("post_trip")}
          >
            Post-Trip
          </button>
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="viLocation">Location (optional)</label>
        <input
          id="viLocation"
          type="text"
          placeholder="Street, city"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="viPlate">License plate # (optional)</label>
        <input id="viPlate" type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="viVehicle">Vehicle make and model (optional)</label>
        <input id="viVehicle" type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="viOdometer">Odometer reading (optional)</label>
        <input id="viOdometer" type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Vehicle inspection</label>
        <p className="form-hint">Check any defective item and give details under Remarks.</p>
        <div className="inspection-checklist">
          {checklistItems.map((item) => (
            <label className="checkbox-label" key={item}>
              <input
                type="checkbox"
                checked={defectiveItems.includes(item)}
                onChange={() => toggleDefect(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="viRemarks">Remarks (optional)</label>
        <textarea
          id="viRemarks"
          rows={3}
          placeholder="Details on any defective item"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Condition of the above vehicle is acceptable</label>
        <div className="type-toggle" role="group" aria-label="Condition acceptable">
          <button
            type="button"
            className={`type-btn${conditionAcceptable ? " active" : ""}`}
            onClick={() => setConditionAcceptable(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`type-btn${!conditionAcceptable ? " active" : ""}`}
            onClick={() => setConditionAcceptable(false)}
          >
            No
          </button>
        </div>
      </div>

      <div className="form-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
          Driver's declaration -- I certify this report is accurate.
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
