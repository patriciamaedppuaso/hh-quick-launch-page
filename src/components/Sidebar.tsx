import { useMemo, useRef, useState } from "react";
import type { AppTile, Role, Theme } from "../types";
import { Icon } from "../icons";
import { initialOf, isAppVisible, isInNav, openTarget } from "../utils";
import { useClickOutside } from "../hooks/useClickOutside";
import { useIsMobile } from "../hooks/useIsMobile";
import { Modal } from "./Modal";

interface Props {
  apps: AppTile[];
  role: Role;
  currentUserName: string;
  activeAppId: string | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNavigate: (appId: string | null) => void;
  onRequestAddToNav: () => void;
  onRemoveFromNav: (appId: string) => void;
  onReorderNav: (apps: AppTile[]) => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const FALLBACK_TINT = { bg: "#EDF7F6", fg: "#479CA4" };

export function Sidebar({
  apps,
  role,
  currentUserName,
  activeAppId,
  theme,
  onThemeChange,
  onNavigate,
  onRequestAddToNav,
  onRemoveFromNav,
  onReorderNav,
  onSignOut,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const [query, setQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navEditMode, setNavEditMode] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // the collapse-to-icons treatment only makes sense on desktop; the mobile
  // drawer always shows full labels regardless of the saved preference
  const isMobile = useIsMobile(999);
  const isCollapsed = collapsed && !isMobile;

  const pages = useMemo(() => {
    const navApps = apps.filter((a) => isAppVisible(a, role) && isInNav(a));
    const q = query.trim().toLowerCase();
    if (!q) return navApps;
    return navApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [apps, query, role]);

  // nav editing (reorder / add / remove) is available to every signed-in user,
  // not just admins -- it only touches shared app placement, not app data.
  const canEditNav = true;
  const canManageNav = canEditNav && navEditMode;
  const canReorder = canManageNav && !isMobile && !query.trim();
  const isDarkActive =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    onThemeChange(isDarkActive ? "light" : "dark");
  }

  function navigate(appId: string | null) {
    onNavigate(appId);
    onCloseMobile();
  }

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      const fromIndex = apps.findIndex((a) => a.id === draggedId);
      const toIndex = apps.findIndex((a) => a.id === targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const next = [...apps];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        onReorderNav(next);
      }
    }
    setDraggedId(null);
    setOverId(null);
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside
        className={`sidebar${mobileOpen ? " sidebar--open" : ""}${isCollapsed ? " sidebar--collapsed" : ""}`}
      >
        <div className="sidebar-brand">
          <img className="brand-logo" src="/assets/images/logo/Icon.png" alt="H&amp;H Medical Supply" />
          {!isCollapsed && (
            <div>
              <div className="brand-name">Quick Launch</div>
              <div className="brand-sub">H&amp;H Medical Supply</div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="sidebar-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search apps..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <div className="sidebar-scroll">
          <button
            type="button"
            className={`sidebar-item${activeAppId === null ? " active" : ""}`}
            onClick={() => navigate(null)}
            title="Dashboard"
          >
            <span className="sidebar-item-icon sidebar-item-icon--home">
              <Icon name="home" />
            </span>
            {!isCollapsed && "Dashboard"}
          </button>

          {isCollapsed ? (
            <div className="sidebar-divider" />
          ) : (
            <div className="sidebar-section-label sidebar-section-label--row">
              <span>Apps</span>
              {canEditNav && (
                <button
                  type="button"
                  className={`sidebar-edit-toggle${navEditMode ? " active" : ""}`}
                  onClick={() => setNavEditMode((v) => !v)}
                  title={navEditMode ? "Done editing nav" : "Edit nav"}
                  aria-label={navEditMode ? "Done editing nav" : "Edit nav"}
                  aria-pressed={navEditMode}
                >
                  <Icon name="edit" />
                </button>
              )}
            </div>
          )}

          {pages.map((app) => {
            const tint = app.tint ?? FALLBACK_TINT;
            return (
              <div
                className={`sidebar-item-row${draggedId === app.id ? " dragging" : ""}${
                  overId === app.id && draggedId && draggedId !== app.id ? " drag-over" : ""
                }`}
                key={app.id}
                draggable={canReorder}
                onDragStart={() => setDraggedId(app.id)}
                onDragOver={(e) => {
                  if (!draggedId) return;
                  e.preventDefault();
                  if (overId !== app.id) setOverId(app.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === app.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(app.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
              >
                {canReorder && (
                  <span className="sidebar-item-handle" aria-hidden="true">
                    <Icon name="grip" />
                  </span>
                )}
                <button
                  type="button"
                  className={`sidebar-item${activeAppId === app.id ? " active" : ""}`}
                  onClick={() => {
                    if (navEditMode) return;
                    if (app.type === "link") {
                      openTarget(app.url, app.isFile, app.fileName);
                      onCloseMobile();
                    } else {
                      navigate(app.id);
                    }
                  }}
                  title={app.name}
                >
                  <span className="sidebar-item-icon" style={{ background: tint.bg, color: tint.fg }}>
                    {app.icon ? (
                      <Icon name={app.icon} />
                    ) : (
                      <span className="badge-letter">{app.initial || initialOf(app.name)}</span>
                    )}
                  </span>
                  {!isCollapsed && <span className="sidebar-item-label">{app.name}</span>}
                </button>
                {!isCollapsed && canManageNav && (
                  <button
                    type="button"
                    className="sidebar-item-remove"
                    title={`Remove ${app.name} from nav`}
                    aria-label={`Remove ${app.name} from nav`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromNav(app.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {!isCollapsed && pages.length === 0 && (
            <p className="sidebar-empty">No apps match &quot;{query}&quot;</p>
          )}

          {canManageNav && (
            <button
              type="button"
              className="sidebar-item sidebar-add"
              onClick={() => {
                onRequestAddToNav();
                onCloseMobile();
              }}
              title="Add app to nav"
            >
              <span className="sidebar-item-icon sidebar-item-icon--add">
                <Icon name="plus" />
              </span>
              {!isCollapsed && "Add app to nav"}
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-item sidebar-collapse-toggle"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="sidebar-item-icon">
              <Icon name="arrow-left" className={isCollapsed ? "sidebar-flip" : ""} />
            </span>
            {!isCollapsed && "Collapse"}
          </button>

          <button
            type="button"
            className="sidebar-item sidebar-mode"
            onClick={toggleTheme}
            title={isDarkActive ? "Dark Mode" : "Light Mode"}
          >
            <span className="sidebar-item-icon">
              <Icon name={isDarkActive ? "moon" : "sun"} />
            </span>
            {!isCollapsed && <span className="sidebar-mode-label">{isDarkActive ? "Dark Mode" : "Light Mode"}</span>}
            {!isCollapsed && (
              <span className={`sidebar-switch${isDarkActive ? " on" : ""}`} aria-hidden="true">
                <span className="sidebar-switch-knob" />
              </span>
            )}
          </button>

          <div className="sidebar-user" ref={userMenuRef}>
            <button
              type="button"
              className="sidebar-item sidebar-user-trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
              title={currentUserName}
            >
              <span className="role-pill-avatar">{initialOf(currentUserName || "?")}</span>
              {!isCollapsed && (
                <span className="sidebar-user-info">
                  <span className="sidebar-user-name">{currentUserName}</span>
                  <span className="sidebar-user-role">{role === "admin" ? "Administrator" : "Staff"}</span>
                </span>
              )}
            </button>
            {userMenuOpen && (
              <div className="dropdown dropdown-wide sidebar-user-menu">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setConfirmSignOut(true);
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <Modal open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out">
        <div className="form-card">
          <p className="form-hint">Are you sure you want to sign out?</p>
          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={() => setConfirmSignOut(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-sm"
              onClick={() => {
                setConfirmSignOut(false);
                onSignOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
