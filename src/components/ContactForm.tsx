import { useState } from "react";
import type { ContactRecord } from "../types";
import { newId } from "../utils";
import { AvatarPicker } from "./AvatarPicker";

interface Props {
  initial?: ContactRecord;
  categoryOptions: string[];
  onSave: (record: ContactRecord) => void;
  onCancel: () => void;
}

export function ContactForm({ initial, categoryOptions, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [category, setCategory] = useState(initial?.category ?? categoryOptions[0] ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("contact"),
      name: trimmedName,
      role: role.trim() || undefined,
      category: category || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      avatar: avatar || undefined,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label>Photo (optional)</label>
        <AvatarPicker name={name} avatar={avatar} onChange={setAvatar} onClear={() => setAvatar("")} />
      </div>
      <div className="form-row">
        <label htmlFor="cName">Name</label>
        <input
          id="cName"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="cRole">Role / Company (optional)</label>
        <input
          id="cRole"
          type="text"
          placeholder="e.g. Manager, Warehouse Lead"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="cCategory">Category</label>
        <select id="cCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="cPhone">Phone (optional)</label>
        <input
          id="cPhone"
          type="tel"
          placeholder="(555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="cEmail">Email (optional)</label>
        <input
          id="cEmail"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="cNotes">Notes (optional)</label>
        <input
          id="cNotes"
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
