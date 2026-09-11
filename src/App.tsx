import { useEffect, useState } from "react";
import type { AppTile, Role } from "./types";
import { loadApps, loadRole, saveApps, saveRole } from "./storage";
import { Header } from "./components/Header";
import { RoleToggle } from "./components/RoleToggle";
import { AppGrid } from "./components/AppGrid";

export default function App() {
  const [apps, setApps] = useState<AppTile[]>(() => loadApps());
  const [role, setRole] = useState<Role>(() => loadRole());

  useEffect(() => {
    saveApps(apps);
  }, [apps]);

  useEffect(() => {
    saveRole(role);
  }, [role]);

  return (
    <div className="wrap">
      <Header />
      <RoleToggle role={role} onChange={setRole} />
      <AppGrid apps={apps} role={role} onAdd={(app) => setApps((prev) => [...prev, app])} />
      <footer>Stored only in this browser</footer>
    </div>
  );
}
