import { useMemo, useState } from "react";
import type { AppTile, Role, TaskPriority, TaskRecord, TaskStatus } from "../types";
import { Icon } from "../icons";
import { formatDate, initialOf, isOverdue } from "../utils";
import { Modal } from "./Modal";
import { TaskForm } from "./TaskForm";

interface Props {
  app: AppTile;
  role: Role;
  onBack: () => void;
  onUpdate: (records: TaskRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

type StatusFilter = "all" | TaskStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High" };
const PRIORITY_COLORS: Record<TaskPriority, { bg: string; fg: string }> = {
  low: { bg: "var(--surface-soft)", fg: "var(--text-secondary)" },
  medium: { bg: "#FCF0DC", fg: "#B9772E" },
  high: { bg: "#F6E2DD", fg: "#C05A4A" },
};

function cycleStatus(status: TaskStatus): TaskStatus {
  if (status === "todo") return "in-progress";
  if (status === "in-progress") return "done";
  return "todo";
}

export function TasksPage({ app, role, onBack, onUpdate }: Props) {
  const records = app.tasks ?? [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.title, t.assignee].some((v) => v?.toLowerCase().includes(q));
    });
  }, [records, query, statusFilter]);

  function toggleStatus(task: TaskRecord) {
    onUpdate(records.map((t) => (t.id === task.id ? { ...t, status: cycleStatus(t.status) } : t)));
  }

  function handleAddSave(record: TaskRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: TaskRecord) {
    onUpdate(records.map((t) => (t.id === record.id ? record : t)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="items-page">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="arrow-left" />
        Back to dashboard
      </button>

      <div className="items-page-head">
        <div className="badge items-page-badge" style={{ background: tint.bg, color: tint.fg }}>
          {app.icon ? <Icon name={app.icon} /> : <span className="badge-letter">{app.initial || initialOf(app.name)}</span>}
        </div>
        <div>
          <h1 className="items-page-title">{app.name}</h1>
          {app.description && <p className="items-page-desc">{app.description}</p>}
        </div>
      </div>

      <div className="items-toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="type-toggle" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`type-btn${statusFilter === f.value ? " active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {canManage && (
          <button type="button" className="btn-primary items-add-btn" onClick={() => setAdding(true)}>
            + Add task
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No tasks yet." : "No tasks match your filters."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((task) => {
            const overdue = task.status !== "done" && isOverdue(task.dueDate);
            return (
              <div className="items-row" key={task.id}>
                <button
                  type="button"
                  className={`task-check task-check--${task.status}`}
                  onClick={() => canManage && toggleStatus(task)}
                  aria-label={`Mark ${task.title} as ${cycleStatus(task.status)}`}
                  disabled={!canManage}
                >
                  {task.status === "done" && <Icon name="check-square" />}
                </button>
                <div className="items-row-text">
                  <span className={`items-row-name${task.status === "done" ? " task-done" : ""}`}>
                    {task.title}
                  </span>
                  {(task.assignee || task.dueDate) && (
                    <span className={`items-row-desc${overdue ? " task-overdue" : ""}`}>
                      {[task.assignee, task.dueDate && `Due ${formatDate(task.dueDate)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
                {task.priority && (
                  <span
                    className="status-pill"
                    style={{ background: PRIORITY_COLORS[task.priority].bg, color: PRIORITY_COLORS[task.priority].fg }}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                )}
                {canManage && (
                  <div
                    className={`items-row-manage${confirmDeleteId === task.id ? " items-row-manage--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="icon-btn-sm"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => setEditing(task)}
                    >
                      <Icon name="edit" />
                    </button>
                    {confirmDeleteId === task.id ? (
                      <span className="confirm-delete">
                        <button type="button" className="btn-danger-sm" onClick={() => handleDelete(task.id)}>
                          Delete
                        </button>
                        <button type="button" className="btn-secondary-sm" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="icon-btn-sm icon-btn-danger"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => setConfirmDeleteId(task.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add task">
        <TaskForm onSave={handleAddSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit task">
        {editing && <TaskForm initial={editing} onSave={handleEditSave} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
