import type { AppTile, BreakEntry, Role, TimeEntry } from "./types";

export const TEAM_MEMBERS = ["Myka", "Front Desk", "Warehouse Team"];

/** Admins always see every app; staff only see the ones marked visible. */
export function isAppVisible(app: AppTile, role: Role): boolean {
  return role === "admin" || app.visible !== false;
}

export const DEFAULT_LEAD_STATUSES = [
  "Contacted",
  "Follow Up",
  "Interested",
  "Schedule Meeting",
  "Signing Contract",
  "Closed",
  "Closed Down",
];

export const DEFAULT_TASK_STATUSES = ["To do", "In progress"];

export const DEFAULT_CONTACT_CATEGORIES = ["Client", "Employee", "Vendor"];

/** Fixed, non-removable task status -- overdue/strikethrough logic depends on it. */
export const DONE_STATUS = "Done";

const STATUS_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#FCF0DC", fg: "#B9772E" },
  { bg: "#E7F6F8", fg: "#2E8B99" },
  { bg: "#EFECFB", fg: "#7C6FE0" },
  { bg: "#EAF1FD", fg: "#5B8DEF" },
  { bg: "#E7EEF3", fg: "#285677" },
  { bg: "#E9F5EF", fg: "#3E9A6D" },
  { bg: "#F6E2DD", fg: "#C05A4A" },
];

/** Assigns a stable color to a status by its position in the app's editable status list. */
export function colorForStatus(options: string[], status: string): { bg: string; fg: string } {
  const idx = options.indexOf(status);
  return STATUS_PALETTE[(idx < 0 ? 0 : idx) % STATUS_PALETTE.length];
}

export function domainOf(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return trimmed.slice(0, 2);
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generatePassword(length = 12): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length]).join("");
}

export function brandLogoSources(url: string): string[] {
  try {
    const domain = new URL(normalizeUrl(url)).hostname;
    if (!domain) return [];
    return [
      `https://logo.clearbit.com/${domain}?size=128`,
      `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    ];
  } catch {
    return [];
  }
}

export function openTarget(url: string, isFile?: boolean, fileName?: string): void {
  if (!url) return;
  if (isFile) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function isPdfFile(fileName?: string, url?: string): boolean {
  if (fileName?.toLowerCase().endsWith(".pdf")) return true;
  return !!url?.startsWith("data:application/pdf");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The business runs on US Pacific time regardless of where a given browser/
// device happens to be set. JS Date objects don't carry a timezone -- every
// getter (getDate, getHours, ...) reads the *host system's* local zone -- so
// "Pacific" has to be applied explicitly via Intl, which also handles the
// PST/PDT switch automatically (a fixed UTC offset would be wrong half the
// year).
export const APP_TIMEZONE = "America/Los_Angeles";

function partsInAppTimeZone(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24, // Intl can return "24" for midnight with hour12:false
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * A Date whose *local* getters (getFullYear, getDate, getDay, getHours, ...)
 * report the wall-clock values as seen in APP_TIMEZONE for the given instant.
 * Its own epoch value is meaningless -- only use it for calendar arithmetic
 * (setDate/getDay/etc.) and reading back with plain local getters, never by
 * comparing/subtracting against a real Date's getTime().
 */
export function toZonedDate(date: Date): Date {
  const p = partsInAppTimeZone(date);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Inverse of toZonedDate: treats (y, m, d, h, min) as APP_TIMEZONE wall-clock
 * time and returns the matching real instant as an ISO string. */
function zonedToUtcIso(year: number, month: number, day: number, hour: number, minute: number): string {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  const observed = partsInAppTimeZone(new Date(guessUtcMs));
  const observedAsUtcMs = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute);
  return new Date(guessUtcMs + (guessUtcMs - observedAsUtcMs)).toISOString();
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  // Pacific calendar date, not the viewer's own local date or UTC.
  return toIsoDate(toZonedDate(new Date()));
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Instant a Y-M-D calendar date starts/ends, as observed in APP_TIMEZONE. */
export function startOfDayIso(dateIso: string): string | undefined {
  const match = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return zonedToUtcIso(Number(match[1]), Number(match[2]), Number(match[3]), 0, 0);
}

export function endOfDayIso(dateIso: string): string | undefined {
  const match = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return zonedToUtcIso(Number(match[1]), Number(match[2]), Number(match[3]), 23, 59);
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const endOfDay = endOfDayIso(iso);
  if (!endOfDay) return false;
  return new Date(endOfDay).getTime() < Date.now();
}

export function formatCurrency(value?: number): string {
  if (value == null) return "";
  return `$${value.toLocaleString()}`;
}

export function builtinCount(app: AppTile): number | undefined {
  switch (app.builtin) {
    case "contacts":
      return app.contacts?.length ?? 0;
    case "leads":
      return app.leads?.length ?? 0;
    case "announcements":
      return app.announcements?.length ?? 0;
    case "tasks":
      return app.tasks?.length ?? 0;
    case "timeclock":
      return app.clockRecords?.length ?? 0;
    default:
      return undefined;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatTimeOfDay(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { timeZone: APP_TIMEZONE, hour: "numeric", minute: "2-digit" });
}

export function formatElapsed(sinceIso: string): string {
  const since = new Date(sinceIso).getTime();
  if (Number.isNaN(since)) return "00:00:00";
  const totalSeconds = Math.max(0, Math.floor((Date.now() - since) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// These feed <input type="datetime-local">, which has no timezone concept of
// its own -- the value shown/entered is treated as Pacific wall-clock time,
// consistent with everywhere else times are displayed.
export function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const z = toZonedDate(d);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}T${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return undefined;
  const [, y, mo, d, h, mi] = match;
  return zonedToUtcIso(Number(y), Number(mo), Number(d), Number(h), Number(mi));
}

export function breakTotalMs(breaks: BreakEntry[]): number {
  return breaks.reduce((sum, b) => {
    const start = new Date(b.start).getTime();
    const end = b.end ? new Date(b.end).getTime() : Date.now();
    return sum + Math.max(0, end - start);
  }, 0);
}

export function workedMs(entry: TimeEntry): number {
  const start = new Date(entry.clockIn).getTime();
  const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
  return Math.max(0, end - start - breakTotalMs(entry.breaks));
}

export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
