import type { AppTile, BreakEntry, TimeEntry } from "./types";

export const CURRENT_USER_NAME = "Myka";

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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(`${iso}T23:59:59`);
  return d.getTime() < Date.now();
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
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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

export function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
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
