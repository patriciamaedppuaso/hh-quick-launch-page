import type { AppTile } from "../types";
import { Icon } from "../icons";
import { initialOf } from "../utils";

interface Props {
  apps: AppTile[];
  activeAppId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: (appId: string | null) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function NavRail({ apps, activeAppId, collapsed, onToggleCollapsed, onNavigate }: Props) {
  const pages = apps.filter((a) => a.type === "list");

  return (
    <nav className={`nav-rail${collapsed ? " nav-rail--collapsed" : ""}`}>
      <button
        type="button"
        className={`nav-rail-item${activeAppId === null ? " active" : ""}`}
        onClick={() => onNavigate(null)}
        title="Dashboard"
      >
        <span className="nav-rail-icon nav-rail-icon--home">
          <Icon name="home" />
        </span>
        <span className="nav-rail-label">Dashboard</span>
      </button>

      <div className="nav-rail-divider" />

      <div className="nav-rail-scroll">
        {pages.map((app) => {
          const tint = app.tint ?? FALLBACK_TINT;
          return (
            <button
              key={app.id}
              type="button"
              className={`nav-rail-item${activeAppId === app.id ? " active" : ""}`}
              onClick={() => onNavigate(app.id)}
              title={app.name}
            >
              <span className="nav-rail-icon" style={{ background: tint.bg, color: tint.fg }}>
                {app.icon ? (
                  <Icon name={app.icon} />
                ) : (
                  <span className="badge-letter">{app.initial || initialOf(app.name)}</span>
                )}
              </span>
              <span className="nav-rail-label">{app.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="nav-rail-item nav-rail-collapse"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <span className="nav-rail-icon">
          <Icon name="arrow-left" className={collapsed ? "nav-rail-flip" : ""} />
        </span>
        <span className="nav-rail-label">Collapse</span>
      </button>
    </nav>
  );
}
