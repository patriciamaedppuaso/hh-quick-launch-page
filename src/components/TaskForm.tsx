import { useState } from "react";
import type { TaskPriority, TaskRecord, TaskStatus } from "../types";
import { newId } from "../utils";

interface Props {
  initial?: TaskRecord;
  statusOptions: string[];
  knownAssignees: string[];
  currentUserName: string;
  onSave: (record: TaskRecord) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskForm({ initial, statusOptions, knownAssignees, currentUserName, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? statusOptions[0]);
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [assignees, setAssignees] = useState<string[]>(initial?.assignees ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [error, setError] = useState("");

  const assigneeOptions =
    currentUserName && !knownAssignees.includes(currentUserName)
      ? [currentUserName, ...knownAssignees]
      : knownAssignees;
  const visibleOptions = Array.from(new Set([...assigneeOptions, ...assignees]));
  const trimmedQuery = assigneeQuery.trim();
  const filteredOptions = trimmedQuery
    ? visibleOptions.filter((n) => n.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : visibleOptions;
  const hasExactMatch = visibleOptions.some((n) => n.toLowerCase() === trimmedQuery.toLowerCase());

  function toggleAssignee(name: string) {
    setAssignees((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function addAssignee() {
    if (!trimmedQuery) return;
    const match = visibleOptions.find((n) => n.toLowerCase() === trimmedQuery.toLowerCase());
    const name = match ?? trimmedQuery;
    if (!assignees.includes(name)) setAssignees((prev) => [...prev, name]);
    setAssigneeQuery("");
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("task"),
      title: trimmedTitle,
      status,
      priority,
      dueDate: dueDate || undefined,
      assignees: assignees.length ? assignees : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="tTitle">Task</label>
        <input
          id="tTitle"
          type="text"
          placeholder="What needs to get done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="tStatus">Status</label>
        <select id="tStatus" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="tPriority">Priority</label>
        <select id="tPriority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="tDue">Due date (optional)</label>
        <input id="tDue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="tAssigneeSearch">Assignees (optional)</label>
        <div className="url-field">
          <input
            id="tAssigneeSearch"
            type="text"
            placeholder="Search or add a name..."
            value={assigneeQuery}
            onChange={(e) => setAssigneeQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAssignee();
              }
            }}
          />
          {trimmedQuery && (
            <button type="button" className="btn-secondary-sm" onClick={addAssignee}>
              {hasExactMatch ? "Assign" : `Add "${trimmedQuery}"`}
            </button>
          )}
        </div>
        <div className="assignee-picker">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((name) => (
              <button
                key={name}
                type="button"
                className={`assignee-option${assignees.includes(name) ? " active" : ""}`}
                onClick={() => toggleAssignee(name)}
              >
                {name}
                {name === currentUserName ? " (You)" : ""}
              </button>
            ))
          ) : (
            <p className="form-hint">No match. Press Add to assign "{trimmedQuery}" as a new name.</p>
          )}
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="tNotes">Notes (optional)</label>
        <textarea
          id="tNotes"
          rows={3}
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
