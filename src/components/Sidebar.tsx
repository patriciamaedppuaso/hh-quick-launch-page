import { useMemo, useRef, useState } from "react";
import type { AppTile, Role, Theme } from "../types";
import { Icon } from "../icons";
import { CURRENT_USER_NAME, initialOf } from "../utils";
import { useClickOutside } from "../hooks/useClickOutside";

interface Props {
  apps: AppTile[];
  role: Role;
  activeAppId: string | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNavigate: (appId: string | null) => void;
  onRequestAdd: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function Sidebar({
  apps,
  role,
  activeAppId,
  theme,
  onThemeChange,
  onNavigate,
  onRequestAdd,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const [query, setQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  const pages = useMemo(() => {
    const listApps = apps.filter((a) => a.type === "list");
    const q = query.trim().toLowerCase();
    if (!q) return listApps;
    return listApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [apps, query]);

  const canAdd = role === "admin";
  const isDarkActive =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    onThemeChange(isDarkActive ? "light" : "dark");
  }

  function navigate(appId: string | null) {
    onNavigate(appId);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            H&amp;H
            <span className="brand-dot" />
          </div>
          <div>
            <div className="brand-name">Quick Launch</div>
            <div className="brand-sub">H&amp;H Medical Supply</div>
          </div>
        </div>

        <div className="sidebar-search">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search apps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="sidebar-scroll">
          <button
            type="button"
            className={`sidebar-item${activeAppId === null ? " active" : ""}`}
            onClick={() => navigate(null)}
          >
            <span className="sidebar-item-icon sidebar-item-icon--home">
              <Icon name="home" />
            </span>
            Dashboard
          </button>

          <div className="sidebar-section-label">Apps</div>

          {pages.map((app) => {
            const tint = app.tint ?? FALLBACK_TINT;
            return (
              <button
                key={app.id}
                type="button"
                className={`sidebar-item${activeAppId === app.id ? " active" : ""}`}
                onClick={() => navigate(app.id)}
              >
                <span className="sidebar-item-icon" style={{ background: tint.bg, color: tint.fg }}>
                  {app.icon ? (
                    <Icon name={app.icon} />
                  ) : (
                    <span className="badge-letter">{app.initial || initialOf(app.name)}</span>
                  )}
                </span>
                <span className="sidebar-item-label">{app.name}</span>
              </button>
            );
          })}

          {pages.length === 0 && (
            <p className="sidebar-empty">No apps match &quot;{query}&quot;</p>
          )}

          {canAdd && (
            <button
              type="button"
              className="sidebar-item sidebar-add"
              onClick={() => {
                onRequestAdd();
                onCloseMobile();
              }}
            >
              <span className="sidebar-item-icon sidebar-item-icon--add">
                <Icon name="plus" />
              </span>
              Add app
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-item sidebar-mode" onClick={toggleTheme}>
            <span className="sidebar-item-icon">
              <Icon name={isDarkActive ? "moon" : "sun"} />
            </span>
            <span className="sidebar-mode-label">{isDarkActive ? "Dark Mode" : "Light Mode"}</span>
            <span className={`sidebar-switch${isDarkActive ? " on" : ""}`} aria-hidden="true">
              <span className="sidebar-switch-knob" />
            </span>
          </button>

          <div className="sidebar-user" ref={userMenuRef}>
            <button
              type="button"
              className="sidebar-item sidebar-user-trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <span className="role-pill-avatar">MM</span>
              <span className="sidebar-user-info">
                <span className="sidebar-user-name">{CURRENT_USER_NAME}</span>
                <span className="sidebar-user-role">{role === "admin" ? "Administrator" : "Staff"}</span>
              </span>
            </button>
            {userMenuOpen && (
              <div className="dropdown dropdown-wide sidebar-user-menu">
                <button type="button" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  Profile settings
                </button>
                <button type="button" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
