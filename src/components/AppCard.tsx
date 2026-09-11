import type { AppTile } from "../types";
import { domainOf, initialOf } from "../utils";

interface Props {
  app: AppTile;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function AppCard({ app, expanded, onToggleExpanded }: Props) {
  const isList = app.type === "list";
  const subtitle = isList
    ? `${app.items.length} ${app.items.length === 1 ? "item" : "items"}`
    : domainOf(app.url);

  return (
    <div className="card">
      <div className="badge">{app.initial || initialOf(app.name)}</div>
      <div>
        <div className="card-name">{app.name}</div>
        <div className="card-url">{subtitle}</div>
      </div>

      {isList && expanded && (
        <div className="list-items">
          {app.items.map((item) => (
            <div className="list-item" key={item.id}>
              <span className="list-item-name">{item.name}</span>
              {item.url ? (
                <button
                  type="button"
                  className="list-item-open"
                  onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                >
                  Open
                </button>
              ) : (
                <span className="list-item-note">No link</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card-bottom">
        {isList ? (
          <button type="button" className="open-btn" onClick={onToggleExpanded}>
            {expanded ? "Hide list" : "View list"}
          </button>
        ) : (
          <button
            type="button"
            className="open-btn"
            onClick={() => window.open(app.url, "_blank", "noopener,noreferrer")}
          >
            Open
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
