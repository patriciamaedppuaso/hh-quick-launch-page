import { useState } from "react";
import type { TaskPriority, TaskRecord, TaskStatus } from "../types";
import { TEAM_MEMBERS, newId } from "../utils";

interface Props {
  initial?: TaskRecord;
  statusOptions: string[];
  currentUserName: string;
  onSave: (record: TaskRecord) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskForm({ initial, statusOptions, currentUserName, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? statusOptions[0]);
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [assignees, setAssignees] = useState<string[]>(initial?.assignees ?? []);

  const assigneeOptions =
    currentUserName && !TEAM_MEMBERS.includes(currentUserName) ? [currentUserName, ...TEAM_MEMBERS] : TEAM_MEMBERS;

  function toggleAssignee(name: string) {
    setAssignees((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      id: initial?.id ?? newId("task"),
      title: trimmedTitle,
      status,
      priority,
      dueDate: dueDate || undefined,
      assignees: assignees.length ? assignees : undefined,
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
        <label>Assignees (optional)</label>
        <div className="assignee-picker">
          {assigneeOptions.map((name) => (
            <button
              key={name}
              type="button"
              className={`assignee-option${assignees.includes(name) ? " active" : ""}`}
              onClick={() => toggleAssignee(name)}
            >
              {name}
              {name === currentUserName ? " (You)" : ""}
            </button>
          ))}
        </div>
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
