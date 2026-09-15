import { useState } from "react";
import type { AppTile } from "../types";
import { builtinCount, domainOf, isPdfFile, openTarget } from "../utils";
import { Icon } from "../icons";
import { AppLogo } from "./AppLogo";
import { FilePreviewModal } from "./FilePreviewModal";

interface Props {
  app: AppTile;
  onOpenItems: () => void;
  showHandle?: boolean;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function AppCard({ app, onOpenItems, showHandle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isList = app.type === "list";
  const linkApp = app.type === "link" ? app : null;
  const tint = app.tint ?? FALLBACK_TINT;
  const count = isList ? (builtinCount(app) ?? app.items.length) : 0;
  const caption = isList
    ? `${count} ${app.unitLabel ?? (count === 1 ? "item" : "items")}`
    : (linkApp?.subtitle ?? domainOf(linkApp?.url ?? ""));
  const canPreview = !!linkApp?.isFile && isPdfFile(linkApp.fileName, linkApp.url);

  function handleOpen() {
    if (!linkApp) return;
    if (canPreview) {
      setPreviewOpen(true);
    } else {
      openTarget(linkApp.url, linkApp.isFile, linkApp.fileName);
    }
  }

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
            onClick={handleOpen}
            aria-label={canPreview ? `View ${app.name}` : `Open ${app.name}`}
            title={canPreview ? "View" : "Open"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
          </button>
        )}
      </div>

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
