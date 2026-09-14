import type { AppTile } from "../types";
import { Icon } from "../icons";
import { AppLogo } from "./AppLogo";
import { openTarget } from "../utils";

interface Props {
  app: AppTile;
  expanded: boolean;
  onToggleExpanded: () => void;
  showHandle?: boolean;
  layout?: "row" | "tile";
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AppRow({ app, expanded, onToggleExpanded, showHandle, layout = "row" }: Props) {
  const isList = app.type === "list";
  const tint = app.tint ?? FALLBACK_TINT;
  const isTile = layout === "tile";

  function handleClick() {
    if (isList) {
      onToggleExpanded();
    } else {
      openTarget(app.url, app.isFile, app.fileName);
    }
  }

  return (
    <div className={`app-row-wrap${isTile ? " app-row-wrap--tile" : ""}`}>
      <button type="button" className={`app-row${isTile ? " app-row--tile" : ""}`} onClick={handleClick}>
        <span className="app-row-icon" style={{ background: tint.bg, color: tint.fg }}>
          <AppLogo app={app} />
        </span>
        <span className="app-row-name" style={isTile ? undefined : { color: tint.fg }}>
          {app.name}
        </span>
        {showHandle && !isTile && (
          <span
            className="drag-handle app-row-handle"
            aria-hidden="true"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="grip" />
          </span>
        )}
      </button>

      {isList && expanded && (
        <div className="list-items list-items-row">
          {app.items.map((item) => (
            <div className="list-item" key={item.id}>
              <span className="list-item-text">
                <span className="list-item-name">{item.name}</span>
                {item.description && <span className="list-item-desc">{item.description}</span>}
              </span>
              {item.url ? (
                <button
                  type="button"
                  className="list-item-open"
                  onClick={() => openTarget(item.url, item.isFile, item.fileName)}
                >
                  {item.isFile ? "Download" : "Open"}
                </button>
              ) : (
                <span className="list-item-note">No link</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
