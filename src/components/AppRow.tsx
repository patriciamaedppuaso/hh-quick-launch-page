import { useState } from "react";
import type { AppTile } from "../types";
import { Icon } from "../icons";
import { AppLogo } from "./AppLogo";
import { isPdfFile, openTarget } from "../utils";
import { FilePreviewModal } from "./FilePreviewModal";

interface Props {
  app: AppTile;
  onOpenItems: () => void;
  showHandle?: boolean;
  layout?: "row" | "tile";
  canEdit?: boolean;
  onEdit?: () => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AppRow({ app, onOpenItems, showHandle, layout = "row", canEdit, onEdit }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isList = app.type === "list";
  const linkApp = app.type === "link" ? app : null;
  const tint = app.tint ?? FALLBACK_TINT;
  const isTile = layout === "tile";
  const isHidden = app.visible === false;
  const canPreview = !!linkApp?.isFile && isPdfFile(linkApp.fileName, linkApp.url);

  function handleClick() {
    if (isList) {
      onOpenItems();
    } else if (linkApp) {
      if (canPreview) {
        setPreviewOpen(true);
      } else {
        openTarget(linkApp.url, linkApp.isFile, linkApp.fileName);
      }
    }
  }

  return (
    <div className={`app-row-wrap${isTile ? " app-row-wrap--tile" : ""}`}>
      <button
        type="button"
        className={`app-row${isTile ? " app-row--tile" : ""}`}
        onClick={handleClick}
        style={isTile ? { background: `color-mix(in srgb, ${tint.fg} 16%, var(--card-bg))` } : undefined}
      >
        <span
          className="app-row-icon"
          style={{ background: isTile ? "var(--card-bg)" : tint.bg, color: tint.fg }}
        >
          <AppLogo app={app} />
        </span>
        <span
          className="app-row-name"
          style={isTile ? undefined : { color: `color-mix(in srgb, ${tint.fg} 65%, var(--text))` }}
        >
          {app.name}
        </span>
        {isHidden && !isTile && <span className="visibility-badge">Hidden</span>}
        {canEdit && !isTile && (
          <span
            className="card-edit-btn app-row-edit"
            role="button"
            aria-label={`Edit ${app.name}`}
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Icon name="edit" />
          </span>
        )}
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

      {canPreview && linkApp && (
        <FilePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={linkApp.fileName}
          url={linkApp.url}
        />
      )}
    </div>
  );
}
