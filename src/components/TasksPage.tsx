import { useMemo, useState } from "react";
import type { AppTile, Role, TaskPriority, TaskRecord, TaskStatus } from "../types";
import { Icon } from "../icons";
import {
  DEFAULT_TASK_STATUSES,
  DONE_STATUS,
  TEAM_MEMBERS,
  colorForStatus,
  formatDate,
  initialOf,
  isOverdue,
} from "../utils";
import { Modal } from "./Modal";
import { TaskForm } from "./TaskForm";
import { ManageStatusesForm } from "./ManageStatusesForm";

interface Props {
  app: AppTile;
  role: Role;
  currentUserName: string;
  onBack: () => void;
  onUpdate: (records: TaskRecord[]) => void;
  onUpdateStatusOptions: (options: string[]) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

type StatusFilter = "all" | TaskStatus;

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High" };
const PRIORITY_COLORS: Record<TaskPriority, { bg: string; fg: string }> = {
  low: { bg: "var(--surface-soft)", fg: "var(--text-secondary)" },
  medium: { bg: "#FCF0DC", fg: "#B9772E" },
  high: { bg: "#F6E2DD", fg: "#C05A4A" },
};

const DONE_COLOR = { bg: "#E9F5EF", fg: "#3E9A6D" };

export function TasksPage({ app, role, currentUserName, onBack, onUpdate, onUpdateStatusOptions }: Props) {
  const records = app.tasks ?? [];
  const editableStatuses = app.statusOptions ?? DEFAULT_TASK_STATUSES;
  const statusTabs = useMemo(() => [...editableStatuses, DONE_STATUS], [editableStatuses]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [managingStatuses, setManagingStatuses] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = role === "admin";
  const tint = app.tint ?? FALLBACK_TINT;

  const FILTERS: { value: StatusFilter; label: string }[] = useMemo(
    () => [{ value: "all", label: "All" }, ...statusTabs.map((s) => ({ value: s, label: s }))],
    [statusTabs],
  );

  const statusColor = (status: string) => (status === DONE_STATUS ? DONE_COLOR : colorForStatus(editableStatuses, status));

  const statusUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of records) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return counts;
  }, [records]);

  const assigneeOptions = useMemo(() => {
    const names = new Set(TEAM_MEMBERS);
    for (const t of records) {
      for (const a of t.assignees ?? []) names.add(a);
    }
    return Array.from(names);
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter === "unassigned" && (t.assignees ?? []).length > 0) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && !(t.assignees ?? []).includes(assigneeFilter))
        return false;
      if (!q) return true;
      if (t.title.toLowerCase().includes(q)) return true;
      return (t.assignees ?? []).some((a) => a.toLowerCase().includes(q));
    });
  }, [records, query, statusFilter, assigneeFilter]);

  function canChangeStatus(task: TaskRecord) {
    return canManage || (task.assignees?.includes(currentUserName) ?? false);
  }

  function handleStatusChange(task: TaskRecord, status: TaskStatus) {
    onUpdate(records.map((t) => (t.id === task.id ? { ...t, status } : t)));
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
        <select
          className="filter-select"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {canManage && (
          <select
            className="filter-select"
            aria-label="Filter by assignee"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="all">Everyone's tasks</option>
            <option value="unassigned">Unassigned</option>
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
        {canManage && (
          <button
            type="button"
            className="card-edit-btn"
            aria-label="Manage statuses"
            title="Manage statuses"
            onClick={() => setManagingStatuses(true)}
          >
            <Icon name="edit" />
          </button>
        )}
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
            const overdue = task.status !== DONE_STATUS && isOverdue(task.dueDate);
            const assignees = task.assignees ?? [];
            return (
              <div className="items-row" key={task.id}>
                <div className="items-row-text">
                  <span className={`items-row-name${task.status === DONE_STATUS ? " task-done" : ""}`}>
                    {task.title}
                  </span>
                </div>

                <div className="task-row-meta">
                  {assignees.length > 0 && (
                    <div className="assignee-chips">
                      {assignees.map((name) => (
                        <span className="assignee-chip" key={name} title={name}>
                          {initialOf(name)}
                        </span>
                      ))}
                    </div>
                  )}
                  {task.dueDate && (
                    <span className={`due-pill${overdue ? " due-pill--overdue" : ""}`}>
                      Due {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.priority && (
                    <span
                      className="status-pill"
                      style={{ background: PRIORITY_COLORS[task.priority].bg, color: PRIORITY_COLORS[task.priority].fg }}
                    >
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                  )}
                  <select
                    className="task-status-select"
                    style={{ background: statusColor(task.status).bg, color: statusColor(task.status).fg }}
                    value={task.status}
                    disabled={!canChangeStatus(task)}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    aria-label={`Status for ${task.title}`}
                  >
                    {statusTabs.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

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
        <TaskForm
          statusOptions={statusTabs}
          currentUserName={currentUserName}
          onSave={handleAddSave}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit task">
        {editing && (
          <TaskForm
            initial={editing}
            statusOptions={statusTabs}
            currentUserName={currentUserName}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={managingStatuses} onClose={() => setManagingStatuses(false)} title="Manage task statuses">
        <ManageStatusesForm
          statuses={editableStatuses}
          usageCounts={statusUsageCounts}
          minCount={0}
          protectedNote={`"${DONE_STATUS}" is built-in and always available — it can't be removed here.`}
          onSave={(next) => {
            onUpdateStatusOptions(next);
            setManagingStatuses(false);
          }}
          onCancel={() => setManagingStatuses(false)}
        />
      </Modal>
    </div>
  );
}
