import { useEffect, useState } from "react";
import type { AppTile, Role, Theme, ViewMode } from "./types";
import { loadApps, loadRole, loadTheme, loadView, saveApps, saveRole, saveTheme, saveView } from "./storage";
import { Header } from "./components/Header";
import { Greeting } from "./components/Greeting";
import { RoleToggle } from "./components/RoleToggle";
import { AppGrid } from "./components/AppGrid";
import { Footer } from "./components/Footer";

export default function App() {
  const [apps, setApps] = useState<AppTile[]>(() => loadApps());
  const [role, setRole] = useState<Role>(() => loadRole());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [view, setView] = useState<ViewMode>(() => loadView());

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

  return (
    <div className="wrap">
      <Header role={role} theme={theme} onThemeChange={setTheme} />
      <Greeting />
      <RoleToggle role={role} onChange={setRole} />
      <AppGrid
        apps={apps}
        role={role}
        view={view}
        onViewChange={setView}
        onAdd={(app) => setApps((prev) => [...prev, app])}
        onReorder={setApps}
      />
      <Footer />
    </div>
  );
}
