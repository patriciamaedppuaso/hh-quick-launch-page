import type { AppTile, Role } from "./types";

const LIST_KEY = "clock-in:apps:v1";
const ROLE_KEY = "clock-in:role:v1";

export const DEFAULT_APPS: AppTile[] = [
  { id: "discord", name: "Discord", type: "link", url: "https://discord.com/app", initial: "D" },
  { id: "crm", name: "CRM", type: "link", url: "https://example-crm.com", initial: "CR" },
  { id: "timeclock", name: "Time Clock", type: "link", url: "https://example-timeclock.com", initial: "TC" },
  {
    id: "leads",
    name: "Leads",
    type: "list",
    initial: "L",
    items: [
      { id: "leads-1", name: "New leads this week", url: "" },
      { id: "leads-2", name: "Follow-up needed", url: "" },
      { id: "leads-3", name: "Cold leads archive", url: "" },
    ],
  },
  {
    id: "contracts",
    name: "Contracts",
    type: "list",
    initial: "Ct",
    items: [
      { id: "contracts-1", name: "Standard sales contract", url: "" },
      { id: "contracts-2", name: "NDA template", url: "" },
      { id: "contracts-3", name: "Vendor agreement", url: "" },
    ],
  },
  {
    id: "procedures",
    name: "Procedures",
    type: "list",
    initial: "P",
    items: [
      { id: "procedures-1", name: "Opening checklist", url: "" },
      { id: "procedures-2", name: "Customer call script", url: "" },
      { id: "procedures-3", name: "Return & refund policy", url: "" },
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
