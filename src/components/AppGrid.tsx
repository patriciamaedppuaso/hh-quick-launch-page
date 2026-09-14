import { useState } from "react";
import type { AppTile, Role, ViewMode } from "../types";
import { AppCard } from "./AppCard";
import { AppRow } from "./AppRow";
import { AddAppForm } from "./AddAppForm";
import { ViewToggle } from "./ViewToggle";
import { useIsMobile } from "../hooks/useIsMobile";

interface Props {
  apps: AppTile[];
  onAdd: (app: AppTile) => void;
  onReorder: (apps: AppTile[]) => void;
  role: Role;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function AppGrid({ apps, onAdd, onReorder, role, view, onViewChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const canReorder = role === "admin" && !isMobile;
  const useIconTiles = view === "grid" && isMobile;

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd(app: AppTile) {
    onAdd(app);
    setAddingNew(false);
  }

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      const fromIndex = apps.findIndex((a) => a.id === draggedId);
      const toIndex = apps.findIndex((a) => a.id === targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const next = [...apps];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        onReorder(next);
      }
    }
    setDraggedId(null);
    setOverId(null);
  }

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Everyday tools</h2>
          <p className="section-sub">
            Your most-used apps and resources
            {canReorder && " · Drag a tile to reorder"}
          </p>
        </div>
        <div className="section-head-actions">
          <span className="ready-badge">{apps.length} apps ready</span>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>

      <div className={`apps-grid${useIconTiles ? " apps-grid--tiles" : ""}`}>
        {apps.map((app) => (
          <div
            key={app.id}
            className={`drag-item${draggedId === app.id ? " dragging" : ""}${
              overId === app.id && draggedId && draggedId !== app.id ? " drag-over" : ""
            }`}
            draggable={canReorder}
            onDragStart={() => setDraggedId(app.id)}
            onDragOver={(e) => {
              if (!draggedId) return;
              e.preventDefault();
              if (overId !== app.id) setOverId(app.id);
            }}
            onDragLeave={() => setOverId((cur) => (cur === app.id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(app.id);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setOverId(null);
            }}
          >
            {view === "list" ? (
              <AppRow
                app={app}
                expanded={!!expanded[app.id]}
                onToggleExpanded={() => toggleExpanded(app.id)}
                showHandle={canReorder}
              />
            ) : useIconTiles ? (
              <AppRow
                app={app}
                expanded={!!expanded[app.id]}
                onToggleExpanded={() => toggleExpanded(app.id)}
                layout="tile"
              />
            ) : (
              <AppCard
                app={app}
                expanded={!!expanded[app.id]}
                onToggleExpanded={() => toggleExpanded(app.id)}
                showHandle={canReorder}
              />
            )}
          </div>
        ))}

        {role === "admin" &&
          (addingNew ? (
            <AddAppForm onSave={handleAdd} onCancel={() => setAddingNew(false)} />
          ) : view === "list" ? (
            <button type="button" className="add-row" onClick={() => setAddingNew(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span className="add-row-title">Add an app</span>
            </button>
          ) : useIconTiles ? (
            <button type="button" className="add-row add-row--tile" onClick={() => setAddingNew(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span className="add-row-title">Add</span>
            </button>
          ) : (
            <button type="button" className="add-card" onClick={() => setAddingNew(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span className="add-card-title">Add an app</span>
              <span className="add-card-sub">Admin access only</span>
            </button>
          ))}
      </div>
    </section>
  );
}
