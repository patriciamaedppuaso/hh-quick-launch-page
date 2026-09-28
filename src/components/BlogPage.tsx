import { useMemo, useState } from "react";
import type { AppTile, BlogPostRecord, Role } from "../types";
import { Icon } from "../icons";
import { canManageApp, formatDate, initialOf } from "../utils";
import { Modal } from "./Modal";
import { BlogPostForm } from "./BlogPostForm";

interface Props {
  app: AppTile;
  role: Role;
  registeredUserNames: string[];
  onBack: () => void;
  onUpdate: (records: BlogPostRecord[]) => void;
}

const FALLBACK_TINT = { bg: "#EAF1FD", fg: "#5B8DEF" };

type StatusFilter = "all" | "published" | "draft";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export function BlogPage({ app, role, registeredUserNames, onBack, onUpdate }: Props) {
  const records = app.blogPosts ?? [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<BlogPostRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageApp(app, role);
  const tint = app.tint ?? FALLBACK_TINT;

  const existingSlugs = useMemo(() => records.map((r) => r.slug), [records]);

  const sorted = useMemo(
    () => [...records].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")),
    [records],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((r) => {
      if (statusFilter === "published" && !r.isActive) return false;
      if (statusFilter === "draft" && r.isActive) return false;
      if (!q) return true;
      return [r.title, r.slug, r.excerpt].some((v) => v?.toLowerCase().includes(q));
    });
  }, [sorted, query, statusFilter]);

  function handleAddSave(record: BlogPostRecord) {
    onUpdate([...records, record]);
    setAdding(false);
  }

  function handleEditSave(record: BlogPostRecord) {
    onUpdate(records.map((r) => (r.id === record.id ? record : r)));
    setEditing(null);
  }

  function handleDelete(id: string) {
    onUpdate(records.filter((r) => r.id !== id));
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
            placeholder="Search posts..."
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
            + New Post
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="items-empty">
          {records.length === 0 ? "No posts yet." : "No posts match your filters."}
        </p>
      ) : (
        <div className="items-list">
          {filtered.map((post) => (
            <div className="items-row" key={post.id}>
              <span className="items-row-icon">
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt="" className="badge-logo" />
                ) : (
                  <Icon name="newspaper" />
                )}
              </span>
              <div className="items-row-text">
                <span className="items-row-name">{post.title}</span>
                <span className="items-row-desc">
                  {post.slug}
                  {post.authorName ? ` · ${post.authorName}` : ""}
                  {post.publishedAt ? ` · ${formatDate(post.publishedAt.slice(0, 10))}` : ""}
                </span>
              </div>
              <span
                className="status-pill"
                style={
                  post.isActive
                    ? { background: "var(--success)", color: "#fff" }
                    : { background: "var(--surface-soft)", color: "var(--text-secondary)" }
                }
              >
                {post.isActive ? "Published" : "Draft"}
              </span>
              {canManage && (
                <div className={`items-row-manage${confirmDeleteId === post.id ? " items-row-manage--active" : ""}`}>
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label={`Edit ${post.title}`}
                    onClick={() => setEditing(post)}
                  >
                    <Icon name="edit" />
                  </button>
                  {confirmDeleteId === post.id ? (
                    <span className="confirm-delete">
                      <button type="button" className="btn-danger-sm" onClick={() => handleDelete(post.id)}>
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
                      aria-label={`Delete ${post.title}`}
                      onClick={() => setConfirmDeleteId(post.id)}
                    >
                      <Icon name="trash" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Blog Post" wide>
        <BlogPostForm
          existingSlugs={existingSlugs}
          authorOptions={registeredUserNames}
          onSave={handleAddSave}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Blog Post" wide>
        {editing && (
          <BlogPostForm
            initial={editing}
            existingSlugs={existingSlugs}
            authorOptions={registeredUserNames}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
