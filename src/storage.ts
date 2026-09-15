import type { AppTile, Role, Theme, ViewMode } from "./types";

const LIST_KEY = "clock-in:apps:v6";
const ROLE_KEY = "clock-in:role:v1";
const THEME_KEY = "clock-in:theme:v1";
const VIEW_KEY = "clock-in:view:v1";
const READ_ANNOUNCEMENTS_KEY = "clock-in:read-announcements:v1";
const SIDEBAR_COLLAPSED_KEY = "clock-in:sidebar-collapsed:v1";

export const DEFAULT_APPS: AppTile[] = [
  {
    id: "timeclock",
    name: "Time Clock",
    type: "list",
    initial: "TC",
    category: "Attendance",
    description: "Clock in, clock out, and view hours",
    unitLabel: "staff",
    icon: "clock",
    tint: { bg: "#FDF1DF", fg: "#C8863A" },
    builtin: "timeclock",
    items: [],
    clockRecords: [
      { id: "clock-1", name: "Myka", clockedIn: true, since: "2026-09-15T07:02:00" },
      { id: "clock-2", name: "Front Desk", clockedIn: true, since: "2026-09-15T06:55:00" },
      { id: "clock-3", name: "Warehouse Team", clockedIn: false },
    ],
  },
  {
    id: "crm",
    name: "CRM",
    type: "link",
    url: "https://example-crm.com",
    initial: "CR",
    category: "Operations",
    description: "Manage clients, patients, and activity",
    subtitle: "Client system",
    icon: "briefcase",
    tint: { bg: "#EAF5F4", fg: "#327E88" },
  },
  {
    id: "discord",
    name: "Discord",
    type: "link",
    url: "https://discord.com/app",
    initial: "D",
    category: "Communication",
    description: "Team communication and updates",
    subtitle: "Team workspace",
    icon: "message",
    tint: { bg: "#EFECFB", fg: "#7C6FE0" },
    useBrandLogo: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    type: "link",
    url: "https://qbo.intuit.com",
    initial: "QB",
    category: "Finance",
    description: "Invoicing, expenses, and accounting",
    subtitle: "Accounting portal",
    icon: "dollar",
    tint: { bg: "#E9F5EF", fg: "#3E9A6D" },
    useBrandLogo: true,
    logoDomain: "quickbooks.intuit.com",
  },
  {
    id: "drive",
    name: "Drive",
    type: "link",
    url: "https://drive.google.com",
    initial: "DR",
    category: "Storage",
    description: "Shared files and folders",
    subtitle: "Cloud storage",
    icon: "cloud",
    tint: { bg: "#EAF1FD", fg: "#5B8DEF" },
    useBrandLogo: true,
  },
  {
    id: "contracts-warranty-quotes",
    name: "Contracts, Warranty & Quotes",
    type: "list",
    initial: "CW",
    category: "Documents",
    description: "Client contracts and agreements",
    unitLabel: "folders",
    icon: "file",
    tint: { bg: "#E7EEF3", fg: "#285677" },
    items: [
      { id: "cwq-1", name: "Standard sales contract", url: "" },
      { id: "cwq-2", name: "NDA template", url: "" },
      { id: "cwq-3", name: "Vendor agreement", url: "", expiresOn: "2026-09-20", updatedAt: "2026-09-12" },
      { id: "cwq-4", name: "Warranty template", url: "", expiresOn: "2026-10-05" },
      { id: "cwq-5", name: "Quote template", url: "" },
    ],
  },
  {
    id: "ringcentral",
    name: "Ring Central",
    type: "link",
    url: "https://app.ringcentral.com",
    initial: "RC",
    category: "Communication",
    description: "Calls, texts, and voicemail",
    subtitle: "Business phone",
    icon: "phone",
    tint: { bg: "#E7F6F8", fg: "#4FB6C7" },
    useBrandLogo: true,
    logoDomain: "ringcentral.com",
  },
  {
    id: "task",
    name: "Task",
    type: "list",
    initial: "T",
    category: "Productivity",
    description: "Track work and assignments",
    unitLabel: "tasks",
    icon: "check-square",
    tint: { bg: "#FCF0DC", fg: "#E8A33D" },
    builtin: "tasks",
    items: [],
    tasks: [
      { id: "task-1", title: "Restock shipping supplies", status: "todo", priority: "medium", assignee: "Myka" },
      {
        id: "task-2",
        title: "Follow up on vendor invoice",
        status: "in-progress",
        priority: "high",
        dueDate: "2026-09-10",
      },
      { id: "task-3", title: "Update store opening checklist", status: "done", priority: "low" },
    ],
  },
  {
    id: "announcements",
    name: "Announcements",
    type: "list",
    initial: "A",
    category: "Updates",
    description: "Company news and updates",
    unitLabel: "posts",
    icon: "megaphone",
    tint: { bg: "#FBEAE6", fg: "#E8836F" },
    builtin: "announcements",
    items: [],
    announcements: [
      {
        id: "ann-1",
        title: "New shipment tracking added",
        message: "You can now track outbound shipments directly from the CRM. Reach out if you need a walkthrough.",
        date: "2026-09-10",
        author: "Admin",
      },
      {
        id: "ann-2",
        title: "Holiday hours reminder",
        message: "The office will close early on the 24th. Please plan deliveries and pickups accordingly.",
        date: "2026-09-05",
        author: "Admin",
      },
    ],
  },
  {
    id: "procedures-guidelines",
    name: "Procedures and Guidelines",
    type: "list",
    initial: "PG",
    category: "Training",
    description: "SOPs, policies, and staff resources",
    unitLabel: "collections",
    icon: "book",
    tint: { bg: "#EEF7F6", fg: "#4E8B8F" },
    items: [
      { id: "pg-1", name: "Opening checklist", url: "" },
      { id: "pg-2", name: "Customer call script", url: "" },
      { id: "pg-3", name: "Return & refund policy", url: "" },
    ],
  },
  {
    id: "contacts",
    name: "Contacts",
    type: "list",
    initial: "Co",
    category: "Directory",
    description: "Staff, vendor, and emergency numbers",
    unitLabel: "contacts",
    icon: "users",
    tint: { bg: "#FAEBF2", fg: "#C77DAE" },
    builtin: "contacts",
    items: [],
    contacts: [
      { id: "contact-1", name: "Front Desk", role: "Staff", phone: "(555) 010-2200" },
      {
        id: "contact-2",
        name: "MedSupply Vendor",
        role: "Vendor",
        phone: "(555) 010-8890",
        email: "orders@medsupplyco.com",
      },
      { id: "contact-3", name: "Building Emergency", role: "Emergency", phone: "(555) 010-9111" },
    ],
  },
  {
    id: "leads",
    name: "Leads",
    type: "list",
    initial: "L",
    category: "Sales",
    description: "Prospects and follow-up activity",
    unitLabel: "leads",
    icon: "user-plus",
    tint: { bg: "#FBEAED", fg: "#E8748A" },
    builtin: "leads",
    items: [],
    leads: [
      {
        id: "lead-1",
        name: "Dr. Patricia Nguyen",
        company: "Nguyen Family Clinic",
        status: "new",
        createdAt: "2026-09-14",
      },
      {
        id: "lead-2",
        name: "Marcus Webb",
        company: "Webb Physical Therapy",
        status: "contacted",
        followUp: "2026-09-18",
        createdAt: "2026-09-11",
      },
      { id: "lead-3", name: "Riverside Urgent Care", status: "qualified", value: 4200, createdAt: "2026-08-20" },
    ],
  },
];

export function loadApps(): AppTile[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return DEFAULT_APPS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_APPS;
  } catch {
    return DEFAULT_APPS;
  }
}

export function saveApps(apps: AppTile[]): void {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(apps));
  } catch {
    // localStorage unavailable (private browsing, quota) — silently skip persistence
  }
}

export function loadRole(): Role {
  try {
    return localStorage.getItem(ROLE_KEY) === "employee" ? "employee" : "admin";
  } catch {
    return "admin";
  }
}

export function saveRole(role: Role): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
  } catch {
    return "system";
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

export function loadView(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw === "grid" || raw === "list") return raw;
    // first visit: default to grid on mobile, list on larger screens
    return window.matchMedia("(max-width: 640px)").matches ? "grid" : "list";
  } catch {
    return "list";
  }
}

export function saveView(view: ViewMode): void {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

export type ReadAnnouncements = Record<Role, string[]>;

export function loadReadAnnouncements(): ReadAnnouncements {
  try {
    const raw = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
    if (!raw) return { admin: [], employee: [] };
    const parsed = JSON.parse(raw);
    return {
      admin: Array.isArray(parsed.admin) ? parsed.admin : [],
      employee: Array.isArray(parsed.employee) ? parsed.employee : [],
    };
  } catch {
    return { admin: [], employee: [] };
  }
}

export function saveReadAnnouncements(data: ReadAnnouncements): void {
  try {
    localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // localStorage unavailable — silently skip persistence
  }
}

