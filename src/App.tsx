import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppTile, ListApp, ReadAnnouncements, Role, Theme, ViewMode } from "./types";
import { loadSidebarCollapsed, loadTheme, loadView, saveSidebarCollapsed, saveTheme, saveView } from "./storage";
import { fetchAllApps, fetchReadAnnouncements, markAnnouncementsReadRemote, syncApps } from "./lib/db";
import { supabase } from "./lib/supabaseClient";
import { type CurrentUser, fetchCurrentUser, signOut } from "./lib/auth";
import { computeMetrics } from "./metrics";
import { todayIso } from "./utils";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { MobileTopBar } from "./components/MobileTopBar";
import { Greeting } from "./components/Greeting";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { AppGrid } from "./components/AppGrid";
import { WidgetsPanel } from "./components/WidgetsPanel";
import { Modal } from "./components/Modal";
import { AddAppForm } from "./components/AddAppForm";
import { EditAppForm } from "./components/EditAppForm";
import { ItemsPage } from "./components/ItemsPage";
import { ContactsPage } from "./components/ContactsPage";
import { LeadsPage } from "./components/LeadsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { TasksPage } from "./components/TasksPage";
import { TimeClockPage } from "./components/TimeClockPage";
import { UsersPage } from "./components/UsersPage";
import { Footer } from "./components/Footer";
import { useToast } from "./components/ToastProvider";

function parseHashAppId(): string | null {
  const match = window.location.hash.match(/^#items\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

const FIELD_LABELS: Record<string, string> = {
  contacts: "Contact",
  leads: "Lead",
  tasks: "Task",
  items: "Item",
  announcements: "Announcement",
  clockRecords: "Staff",
  timeEntries: "Time entry",
  statusOptions: "List",
  name: "App",
  visible: "App",
  description: "App",
};

function describeChange(prevApp: AppTile | undefined, patch: Partial<AppTile>): string {
  for (const key of Object.keys(patch) as (keyof AppTile)[]) {
    const label = FIELD_LABELS[key];
    if (!label) continue;
    const nextValue = patch[key];
    if (Array.isArray(nextValue)) {
      const prevArr = (prevApp?.[key] as unknown[] | undefined) ?? [];
      if (nextValue.length > prevArr.length) return `${label} added`;
      if (nextValue.length < prevArr.length) return `${label} deleted`;
      return `${label} updated`;
    }
    return `${label} updated`;
  }
  return "Changes saved";
}

const SYNCED_TABLES = [
  "apps",
  "list_items",
  "contacts",
  "leads",
  "announcements",
  "announcement_attachments",
  "read_announcements",
  "tasks",
  "task_assignees",
  "clock_records",
  "time_entries",
  "time_entry_breaks",
];

export default function App() {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [apps, setApps] = useState<AppTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [view, setView] = useState<ViewMode>(() => loadView());
  const [openAppId, setOpenAppId] = useState<string | null>(() => parseHashAppId());
  const [readAnnouncements, setReadAnnouncements] = useState<ReadAnnouncements>({ admin: [], employee: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => loadSidebarCollapsed());
  const [addingApp, setAddingApp] = useState(false);
  const [editingApp, setEditingApp] = useState<AppTile | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const hideThumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollThumb, setScrollThumb] = useState({ top: 0, height: 0, visible: false });

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Depend on the user id, not the whole `session` object: Supabase silently
  // reissues a new session object (same user) whenever the tab regains focus
  // or the token refreshes, which would otherwise re-run this on every tab
  // switch.
  const sessionUserId = session?.user?.id;

  useEffect(() => {
    if (!session) {
      setCurrentUser(null);
      return;
    }
    let cancelled = false;
    fetchCurrentUser(session.user.id, session.user.email ?? "")
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch((err) => console.error("Failed to load current user's profile:", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  const role: Role = currentUser?.role ?? "employee";
  const currentUserName = currentUser?.name || currentUser?.email || "";

  async function reloadFromSupabase() {
    const [nextApps, nextRead] = await Promise.all([fetchAllApps(), fetchReadAnnouncements()]);
    setApps(nextApps);
    setReadAnnouncements(nextRead);
  }

  useEffect(() => {
    // RLS now requires an authenticated session (see migration 0004), so
    // there's nothing to fetch until login completes. Re-runs on the user id
    // (not the whole session object, which changes on every token refresh)
    // -- covers the initial post-login load and a logout/login-as-someone-
    // else cycle without a full page reload.
    if (!sessionUserId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await reloadFromSupabase();
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load data from Supabase.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  // Realtime: pick up changes made from other tabs/devices. A remote write on
  // any synced table triggers a full reload (simple and always-correct; this
  // app's data volume makes that cheap).
  useEffect(() => {
    const channel = supabase.channel("dashboard-sync");
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    for (const table of SYNCED_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          reloadFromSupabase().catch((err) => console.error("Supabase realtime reload failed:", err));
        }, 400);
      });
    }
    channel.subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setAppsAndSync(
    updater: AppTile[] | ((prev: AppTile[]) => AppTile[]),
    successMessage?: string | ((prev: AppTile[], next: AppTile[]) => string),
  ) {
    setApps((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const message = typeof successMessage === "function" ? successMessage(prev, next) : successMessage;
      syncApps(prev, next)
        .then(() => {
          if (message) toast.success(message);
        })
        .catch((err) => {
          console.error("Supabase sync failed:", err);
          toast.error("Couldn't save your changes. Please try again.");
        });
      return next;
    });
  }

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
    () => computeMetrics(apps, role, readAnnouncements[role] ?? [], currentUserName),
    [apps, role, readAnnouncements, currentUserName],
  );

  const announcementsApp = apps.find((a) => a.builtin === "announcements");
  const todaysAnnouncement = useMemo(() => {
    const list = announcementsApp?.announcements ?? [];
    if (list.length === 0) return null;
    const mostRecent = [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (mostRecent.date !== todayIso()) return null;
    if ((readAnnouncements[role] ?? []).includes(mostRecent.id)) return null;
    return mostRecent;
  }, [announcementsApp, readAnnouncements, role]);

  function openItems(appId: string) {
    window.location.hash = `items/${appId}`;
  }

  function closeItems() {
    window.location.hash = "";
  }

  function updateApp(appId: string, patch: Partial<AppTile>) {
    setAppsAndSync(
      (prev) => prev.map((a) => (a.id === appId ? ({ ...a, ...patch } as AppTile) : a)),
      (prev) => describeChange(prev.find((a) => a.id === appId), patch),
    );
  }

  function markAnnouncementsRead(ids: string[]) {
    setReadAnnouncements((prev) => ({
      ...prev,
      [role]: Array.from(new Set([...(prev[role] ?? []), ...ids])),
    }));
    markAnnouncementsReadRemote(role, ids).catch((err) => console.error("Failed to mark announcements read:", err));
  }

  function handleAddApp(app: AppTile) {
    setAppsAndSync((prev) => [...prev, app], "App added");
    setAddingApp(false);
  }

  function handleEditApp(patch: { name: string; description?: string; visible: boolean }) {
    if (!editingApp) return;
    updateApp(editingApp.id, patch);
    setEditingApp(null);
  }

  function handleDeleteApp() {
    if (!editingApp) return;
    const appId = editingApp.id;
    setAppsAndSync((prev) => prev.filter((a) => a.id !== appId), "App deleted");
    setEditingApp(null);
    if (openAppId === appId) setOpenAppId(null);
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
            onUpdateStatusOptions={(statusOptions) => updateApp(app.id, { statusOptions })}
          />
        );
      case "leads":
        return (
          <LeadsPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdate={(leads) => updateApp(app.id, { leads })}
            onUpdateStatusOptions={(statusOptions) => updateApp(app.id, { statusOptions })}
          />
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
          <TasksPage
            app={app}
            role={role}
            currentUserName={currentUserName}
            onBack={closeItems}
            onUpdate={(tasks) => updateApp(app.id, { tasks })}
            onUpdateStatusOptions={(statusOptions) => updateApp(app.id, { statusOptions })}
          />
        );
      case "timeclock":
        return (
          <TimeClockPage
            app={app}
            role={role}
            currentUserName={currentUserName}
            onBack={closeItems}
            onUpdate={(patch) => updateApp(app.id, patch)}
          />
        );
      case "users":
        return <UsersPage app={app} role={role} onBack={closeItems} />;
      default:
        return (
          <ItemsPage
            app={app}
            role={role}
            onBack={closeItems}
            onUpdateItems={(items) => updateApp(app.id, { items })}
            onUpdateStatusOptions={(statusOptions) => updateApp(app.id, { statusOptions })}
          />
        );
    }
  }

  if (authLoading) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" aria-hidden="true" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="boot-screen">
        <p className="boot-error-title">Couldn't reach Supabase</p>
        <p className="boot-error-detail">{loadError}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`wrap${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <MobileTopBar onOpenMenu={() => setSidebarOpen(true)} />
      <Sidebar
        apps={apps}
        role={role}
        currentUserName={currentUserName}
        activeAppId={openAppId}
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={(appId) => (appId ? openItems(appId) : closeItems())}
        onRequestAdd={() => setAddingApp(true)}
        onSignOut={() =>
          signOut().catch((err) => {
            console.error("Sign out failed:", err);
            toast.error("Couldn't sign out. Please try again.");
          })
        }
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
            {todaysAnnouncement && announcementsApp && (
              <AnnouncementBanner
                announcement={todaysAnnouncement}
                unread
                onOpen={() => openItems(announcementsApp.id)}
              />
            )}
            <AppGrid
              apps={apps}
              role={role}
              view={view}
              onViewChange={setView}
              onReorder={(next) => setAppsAndSync(next, "Dashboard order updated")}
              onOpenItems={openItems}
              onRequestAdd={() => setAddingApp(true)}
              onEditApp={(app) => setEditingApp(app)}
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

      <Modal open={!!editingApp} onClose={() => setEditingApp(null)} title="Edit app">
        {editingApp && (
          <EditAppForm
            app={editingApp}
            onSave={handleEditApp}
            onDelete={handleDeleteApp}
            onCancel={() => setEditingApp(null)}
          />
        )}
      </Modal>
    </div>
  );
}
