import { useState } from "react";
import type { AppTile, Role } from "../types";
import { AppCard } from "./AppCard";
import { AddAppForm } from "./AddAppForm";

interface Props {
  apps: AppTile[];
  onAdd: (app: AppTile) => void;
  role: Role;
}

export function AppGrid({ apps, onAdd, role }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingNew, setAddingNew] = useState(false);

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd(app: AppTile) {
    onAdd(app);
    setAddingNew(false);
  }

  return (
    <div className="grid">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          expanded={!!expanded[app.id]}
          onToggleExpanded={() => toggleExpanded(app.id)}
        />
      ))}

      {role === "admin" &&
        (addingNew ? (
          <AddAppForm onSave={handleAdd} onCancel={() => setAddingNew(false)} />
        ) : (
          <button type="button" className="add-card" onClick={() => setAddingNew(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add app
          </button>
        ))}
    </div>
  );
}
