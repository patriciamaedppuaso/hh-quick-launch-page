import type { AppTile } from "../types";
import { Icon } from "../icons";
import { initialOf, isInNav } from "../utils";

interface Props {
  apps: AppTile[];
  onAdd: (appId: string) => void;
  onDone: () => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AddToNavForm({ apps, onAdd, onDone }: Props) {
  const candidates = apps.filter((a) => !isInNav(a));

  return (
    <div className="form-card">
      <p className="form-hint">Pick an existing app to pin into the sidebar. This doesn't create a new app.</p>

      {candidates.length === 0 ? (
        <p className="sidebar-empty">Every app is already in the nav.</p>
      ) : (
        <div className="nav-candidate-list">
          {candidates.map((app) => {
            const tint = app.tint ?? FALLBACK_TINT;
            return (
              <div className="nav-candidate-row" key={app.id}>
                <span className="sidebar-item-icon" style={{ background: tint.bg, color: tint.fg }}>
                  {app.icon ? <Icon name={app.icon} /> : <span className="badge-letter">{app.initial || initialOf(app.name)}</span>}
                </span>
                <span className="nav-candidate-info">
                  <span className="nav-candidate-name">{app.name}</span>
                  <span className="nav-candidate-type">{app.type === "link" ? "Link app" : "List app"}</span>
                </span>
                <button type="button" className="btn-secondary-sm" onClick={() => onAdd(app.id)}>
                  Add to nav
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="form-buttons">
        <button type="button" className="btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
