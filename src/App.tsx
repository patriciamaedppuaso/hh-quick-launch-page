import { useEffect, useMemo, useRef, useState } from "react";
import type { AppTile, ListApp, Role, Theme, ViewMode } from "./types";
import {
  loadApps,
  loadReadAnnouncements,
  loadRole,
  loadSidebarCollapsed,
  loadTheme,
  loadView,
  saveApps,
  saveReadAnnouncements,
  saveRole,
  saveSidebarCollapsed,
  saveTheme,
  saveView,
} from "./storage";
import type { ReadAnnouncements } from "./storage";
import { computeMetrics } from "./metrics";
import { Sidebar } from "./components/Sidebar";
import { MobileTopBar } from "./components/MobileTopBar";
import { Greeting } from "./components/Greeting";
import { RoleToggle } from "./components/RoleToggle";
import { AppGrid } from "./components/AppGrid";
import { WidgetsPanel } from "./components/WidgetsPanel";
import { Modal } from "./components/Modal";
import { AddAppForm } from "./components/AddAppForm";
import { ItemsPage } from "./components/ItemsPage";
import { ContactsPage } from "./components/ContactsPage";
import { LeadsPage } from "./components/LeadsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { TasksPage } from "./components/TasksPage";
import { TimeClockPage } from "./components/TimeClockPage";
import { Footer } from "./components/Footer";

function parseHashAppId(): string | null {
  const match = window.location.hash.match(/^#items\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [apps, setApps] = useState<AppTile[]>(() => loadApps());
  const [role, setRole] = useState<Role>(() => loadRole());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [view, setView] = useState<ViewMode>(() => loadView());
  const [openAppId, setOpenAppId] = useState<string | null>(() => parseHashAppId());
  const [readAnnouncements, setReadAnnouncements] = useState<ReadAnnouncements>(() => loadReadAnnouncements());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => loadSidebarCollapsed());
  const [addingApp, setAddingApp] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const hideThumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollThumb, setScrollThumb] = useState({ top: 0, height: 0, visible: false });

  useEffect(() => {
    saveApps(apps);
  }, [apps]);

  useEffect(() => {
    saveRole(role);
  }, [role]);

  useEffect(() => {
    saveTheme(theme);
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    saveView(view);
  }, [view]);

  useEffect(() => {
    saveReadAnnouncements(readAnnouncements);
  }, [readAnnouncements]);

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    function handleHashChange() {
      setOpenAppId(parseHashAppId());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function updateScrollThumb(show: boolean) {
    const el = mainRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setScrollThumb({ top: 0, height: 0, visible: false });
      return;
    }
    const thumbHeight = Math.max(30, (clientHeight / scrollHeight) * clientHeight);
    const maxThumbTop = clientHeight - thumbHeight;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxThumbTop;
    setScrollThumb({ top, height: thumbHeight, visible: show });
    if (hideThumbTimer.current) clearTimeout(hideThumbTimer.current);
    if (show) {
      hideThumbTimer.current = setTimeout(() => {
        setScrollThumb((t) => ({ ...t, visible: false }));
      }, 900);
    }
  }

  function handleThumbPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const el = mainRef.current;
    if (!el) return;
    const startY = e.clientY;
    const startScrollTop = el.scrollTop;
    const trackHeight = el.clientHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const thumbHeight = Math.max(30, (trackHeight / el.scrollHeight) * trackHeight);
    const maxThumbTop = trackHeight - thumbHeight;

    function onMove(ev: PointerEvent) {
      if (!el || maxThumbTop <= 0) return;
      const deltaY = ev.clientY - startY;
      const deltaScroll = (deltaY / maxThumbTop) * maxScroll;
      el.scrollTop = Math.min(maxScroll, Math.max(0, startScrollTop + deltaScroll));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    updateScrollThumb(true);
  }

  useEffect(() => {
    updateScrollThumb(false);
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollThumb(false));
    observer.observe(el);
    window.addEventListener("resize", () => updateScrollThumb(false));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAppId, apps, view, sidebarCollapsed]);

  useEffect(() => {
    return () => {
      if (hideThumbTimer.current) clearTimeout(hideThumbTimer.current);
    };
  }, []);

  const activeApp = openAppId
    ? apps.find((a): a is ListApp => a.id === openAppId && a.type === "list")
    : undefined;

  const metrics = useMemo(
    () => computeMetrics(apps, role, readAnnouncements[role] ?? []),
    [apps, role, readAnnouncements],
  );

  function openItems(appId: string) {
    window.location.hash = `items/${appId}`;
  }

  function closeItems() {
    window.location.hash = "";
  }

  function updateApp(appId: string, patch: Partial<AppTile>) {
    setApps((prev) => prev.map((a) => (a.id === appId ? ({ ...a, ...patch } as AppTile) : a)));
  }

  function markAnnouncementsRead(ids: string[]) {
    setReadAnnouncements((prev) => ({
      ...prev,
      [role]: Array.from(new Set([...(prev[role] ?? []), ...ids])),
    }));
  }

  function handleAddApp(app: AppTile) {
    setApps((prev) => [...prev, app]);
    setAddingApp(false);
  }

  function renderActiveApp(app: ListApp) {
    switch (app.builtin) {
      case "contacts":
        return (
          <ContactsPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdate={(contacts) => updateApp(app.id, { contacts })}
          />
        );
      case "leads":
        return (
          <LeadsPage app={app} role={role} onBack={closeItems} onUpdate={(leads) => updateApp(app.id, { leads })} />
        );
      case "announcements":
        return (
          <AnnouncementsPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdate={(announcements) => updateApp(app.id, { announcements })}
            readIds={readAnnouncements[role] ?? []}
            onMarkRead={markAnnouncementsRead}
          />
        );
      case "tasks":
        return (
          <TasksPage app={app} role={role} onBack={closeItems} onUpdate={(tasks) => updateApp(app.id, { tasks })} />
        );
      case "timeclock":
        return (
          <TimeClockPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdate={(clockRecords) => updateApp(app.id, { clockRecords })}
          />
        );
      default:
        return (
          <ItemsPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdateItems={(items) => updateApp(app.id, { items })}
          />
        );
    }
  }

  return (
    <div className={`wrap${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <MobileTopBar onOpenMenu={() => setSidebarOpen(true)} />
      <Sidebar
        apps={apps}
        role={role}
        activeAppId={openAppId}
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={(appId) => (appId ? openItems(appId) : closeItems())}
        onRequestAdd={() => setAddingApp(true)}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />
      <main className="app-main" ref={mainRef} onScroll={() => updateScrollThumb(true)}>
        {activeApp ? (
          renderActiveApp(activeApp)
        ) : (
          <>
            <Greeting />
            <RoleToggle role={role} onChange={setRole} />
            <AppGrid
              apps={apps}
              role={role}
              view={view}
              onViewChange={setView}
              onReorder={setApps}
              onOpenItems={openItems}
              onRequestAdd={() => setAddingApp(true)}
            />
          </>
        )}
        <Footer />
      </main>
      <WidgetsPanel apps={apps} metrics={metrics} onOpen={openItems} />

      {scrollThumb.height > 0 && (
        <div className="main-scroll-track" aria-hidden="true">
          <div
            className={`main-scroll-thumb${scrollThumb.visible ? " main-scroll-thumb--visible" : ""}`}
            style={{ top: scrollThumb.top, height: scrollThumb.height }}
            onPointerDown={handleThumbPointerDown}
          />
        </div>
      )}

      <Modal open={addingApp} onClose={() => setAddingApp(false)} title="Add an app">
        <AddAppForm onSave={handleAddApp} onCancel={() => setAddingApp(false)} />
      </Modal>
    </div>
  );
}
