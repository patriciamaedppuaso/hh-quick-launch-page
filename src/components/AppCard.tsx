import type { AppTile } from "../types";
import { domainOf, openTarget } from "../utils";
import { Icon } from "../icons";
import { AppLogo } from "./AppLogo";

interface Props {
  app: AppTile;
  onOpenItems: () => void;
  showHandle?: boolean;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AppCard({ app, onOpenItems, showHandle }: Props) {
  const isList = app.type === "list";
  const tint = app.tint ?? FALLBACK_TINT;
  const caption = isList
    ? `${app.items.length} ${app.unitLabel ?? (app.items.length === 1 ? "item" : "items")}`
    : (app.subtitle ?? domainOf(app.url));

  return (
    <div
      className="card"
      style={{
        background: `linear-gradient(160deg, color-mix(in srgb, ${tint.fg} 16%, var(--card-bg)) 0%, var(--card-bg) 55%)`,
      }}
    >
      <div className="card-top">
        <div className="badge" style={{ background: tint.bg, color: tint.fg }}>
          <AppLogo app={app} />
        </div>
        <div className="card-top-right">
          {app.category && <span className="category-badge">{app.category}</span>}
          {showHandle && (
            <span className="drag-handle" aria-hidden="true" title="Drag to reorder">
              <Icon name="grip" />
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="card-name">{app.name}</div>
        {app.description && <div className="card-desc">{app.description}</div>}
      </div>

      <div className="card-bottom">
        <span className="card-caption">{caption}</span>
        {isList ? (
          <button
            type="button"
            className="view-btn"
            onClick={onOpenItems}
            aria-label={`View ${app.name}`}
            title="View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="open-btn"
            onClick={() => openTarget(app.url, app.isFile, app.fileName)}
            aria-label={`Open ${app.name}`}
            title="Open"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
