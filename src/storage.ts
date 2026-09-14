import type { AppTile, Role, Theme, ViewMode } from "./types";

const LIST_KEY = "clock-in:apps:v3";
const ROLE_KEY = "clock-in:role:v1";
const THEME_KEY = "clock-in:theme:v1";
const VIEW_KEY = "clock-in:view:v1";

export const DEFAULT_APPS: AppTile[] = [
  {
    id: "timeclock",
    name: "Time Clock",
    type: "link",
    url: "https://example-timeclock.com",
    initial: "TC",
    category: "Attendance",
    description: "Clock in, clock out, and view hours",
    subtitle: "Employee portal",
    icon: "clock",
    tint: { bg: "#FDF1DF", fg: "#C8863A" },
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
      { id: "cwq-3", name: "Vendor agreement", url: "" },
      { id: "cwq-4", name: "Warranty template", url: "" },
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
    type: "link",
    url: "https://example-tasks.com",
    initial: "T",
    category: "Productivity",
    description: "Track work and assignments",
    subtitle: "Task board",
    icon: "check-square",
    tint: { bg: "#FCF0DC", fg: "#E8A33D" },
  },
  {
    id: "announcements",
    name: "Announcements",
    type: "list",
    initial: "A",
    category: "Updates",
    description: "Company news and updates",
    unitLabel: "updates",
    icon: "megaphone",
    tint: { bg: "#FBEAE6", fg: "#E8836F" },
    items: [
      { id: "ann-1", name: "This week's announcements", url: "" },
      { id: "ann-2", name: "Policy updates", url: "" },
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
    unitLabel: "directories",
    icon: "users",
    tint: { bg: "#FAEBF2", fg: "#C77DAE" },
    items: [
      { id: "contacts-1", name: "Staff directory", url: "" },
      { id: "contacts-2", name: "Vendor contacts", url: "" },
      { id: "contacts-3", name: "Emergency contacts", url: "" },
    ],
  },
  {
    id: "leads",
    name: "Leads",
    type: "list",
    initial: "L",
    category: "Sales",
    description: "Prospects and follow-up activity",
    unitLabel: "active lists",
    icon: "user-plus",
    tint: { bg: "#FBEAED", fg: "#E8748A" },
    items: [
      { id: "leads-1", name: "New leads this week", url: "" },
      { id: "leads-2", name: "Follow-up needed", url: "" },
      { id: "leads-3", name: "Cold leads archive", url: "" },
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
