import { useEffect, useMemo, useState } from "react";
import type { AppTile, ListApp, Role, Theme, ViewMode } from "./types";
import {
  loadApps,
  loadReadAnnouncements,
  loadRole,
  loadTheme,
  loadView,
  saveApps,
  saveReadAnnouncements,
  saveRole,
  saveTheme,
  saveView,
} from "./storage";
import type { ReadAnnouncements } from "./storage";
import { computeMetrics } from "./metrics";
import { Header } from "./components/Header";
import { Greeting } from "./components/Greeting";
import { MetricsRow } from "./components/MetricsRow";
import { RoleToggle } from "./components/RoleToggle";
import { AppGrid } from "./components/AppGrid";
import { ItemsPage } from "./components/ItemsPage";
import { ContactsPage } from "./components/ContactsPage";
import { LeadsPage } from "./components/LeadsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { TasksPage } from "./components/TasksPage";
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
    function handleHashChange() {
      setOpenAppId(parseHashAppId());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
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
    <div className="wrap">
      <Header role={role} theme={theme} onThemeChange={setTheme} divided={!!activeApp} />
      {activeApp ? (
        renderActiveApp(activeApp)
      ) : (
        <>
          <Greeting />
          <MetricsRow metrics={metrics} onOpen={openItems} />
          <RoleToggle role={role} onChange={setRole} />
          <AppGrid
            apps={apps}
            role={role}
            view={view}
            onViewChange={setView}
            onAdd={(app) => setApps((prev) => [...prev, app])}
            onReorder={setApps}
            onOpenItems={openItems}
          />
        </>
      )}
      <Footer />
    </div>
  );
}
