import { useState } from "react";
import type { TaskPriority, TaskRecord, TaskStatus } from "../types";
import { newId } from "../utils";

interface Props {
  initial?: TaskRecord;
  onSave: (record: TaskRecord) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [assignee, setAssignee] = useState(initial?.assignee ?? "");

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      id: initial?.id ?? newId("task"),
      title: trimmedTitle,
      status,
      priority,
      dueDate: dueDate || undefined,
      assignee: assignee.trim() || undefined,
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
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
        <label htmlFor="tAssignee">Assignee (optional)</label>
        <input
          id="tAssignee"
          type="text"
          placeholder="Who's on it?"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
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
