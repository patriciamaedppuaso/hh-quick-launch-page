import type { AppTile, Role } from "../types";
import { Icon } from "../icons";
import { getMostUsedApps, initialOf, isAppVisible, openTarget, recordAppUsage } from "../utils";

interface Props {
  apps: AppTile[];
  role: Role;
  onOpenItems: (appId: string) => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function MostUsedApps({ apps, role, onOpenItems }: Props) {
  const visibleApps = apps.filter((a) => isAppVisible(a, role));
  const mostUsed = getMostUsedApps(visibleApps, 6);

  if (mostUsed.length === 0) return null;

  return (
    <section className="most-used">
      <div className="section-head">
        <h2>
          <span className="accent-bar" aria-hidden="true" />
          Most used
        </h2>
      </div>
      <div className="most-used-strip">
        {mostUsed.map((app) => {
          const tint = app.tint ?? FALLBACK_TINT;
          return (
            <button
              key={app.id}
              type="button"
              className="most-used-item"
              title={app.name}
              onClick={() => {
                if (app.type === "link") {
                  recordAppUsage(app.id);
                  openTarget(app.url, app.isFile, app.fileName);
                } else {
                  onOpenItems(app.id);
                }
              }}
            >
              <span className="most-used-icon" style={{ background: tint.bg, color: tint.fg }}>
                {app.icon ? (
                  <Icon name={app.icon} />
                ) : (
                  <span className="badge-letter">{app.initial || initialOf(app.name)}</span>
                )}
              </span>
              <span className="most-used-label">{app.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
