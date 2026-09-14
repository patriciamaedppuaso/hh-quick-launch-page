import { useEffect, useState } from "react";
import type { AppTile, ListApp, Role, Theme, ViewMode } from "./types";
import { loadApps, loadRole, loadTheme, loadView, saveApps, saveRole, saveTheme, saveView } from "./storage";
import { Header } from "./components/Header";
import { Greeting } from "./components/Greeting";
import { RoleToggle } from "./components/RoleToggle";
import { AppGrid } from "./components/AppGrid";
import { ItemsPage } from "./components/ItemsPage";
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
    function handleHashChange() {
      setOpenAppId(parseHashAppId());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const activeApp = openAppId
    ? apps.find((a): a is ListApp => a.id === openAppId && a.type === "list")
    : undefined;

  function openItems(appId: string) {
    window.location.hash = `items/${appId}`;
  }

  function closeItems() {
    window.location.hash = "";
  }

  return (
    <div className="wrap">
      <Header role={role} theme={theme} onThemeChange={setTheme} />
      {activeApp ? (
        <ItemsPage
          app={activeApp}
          role={role}
          onBack={closeItems}
          onUpdateItems={(items) =>
            setApps((prev) =>
              prev.map((a) => (a.id === activeApp.id && a.type === "list" ? { ...a, items } : a)),
            )
          }
        />
      ) : (
        <>
          <Greeting />
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
