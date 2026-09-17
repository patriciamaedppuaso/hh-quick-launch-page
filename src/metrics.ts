import type { AppTile, Role } from "./types";
import { DONE_STATUS, endOfDayIso, isOverdue, startOfDayIso } from "./utils";

export interface Metric {
  key: string;
  label: string;
  value: number;
  appId: string;
  urgent?: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 30;
const EXPIRING_URGENT_DAYS = 7;

export function computeMetrics(
  apps: AppTile[],
  role: Role,
  readAnnouncementIds: string[],
  currentUserName: string,
): Metric[] {
  const taskApp = apps.find((a) => a.builtin === "tasks");
  const leadsApp = apps.find((a) => a.builtin === "leads");
  const announcementsApp = apps.find((a) => a.builtin === "announcements");

  const now = Date.now();
  const allTasks = taskApp?.tasks ?? [];
  const overdueAll = allTasks.filter((t) => t.status !== DONE_STATUS && isOverdue(t.dueDate)).length;
  const overdueMine = allTasks.filter(
    (t) => t.status !== DONE_STATUS && t.assignees?.includes(currentUserName) && isOverdue(t.dueDate),
  ).length;

  let expiringSoon = 0;
  let expiringUrgent = 0;
  let expiringAppId = "";
  for (const app of apps) {
    if (app.type !== "list") continue;
    for (const item of app.items) {
      if (!item.expiresOn) continue;
      const expiresAt = endOfDayIso(item.expiresOn);
      if (!expiresAt) continue;
      const daysLeft = (new Date(expiresAt).getTime() - now) / DAY;
      if (daysLeft <= EXPIRING_SOON_DAYS) {
        expiringSoon++;
        if (!expiringAppId) expiringAppId = app.id;
      }
      if (daysLeft <= EXPIRING_URGENT_DAYS) expiringUrgent++;
    }
  }

  const announcements = announcementsApp?.announcements ?? [];
  const unread = announcements.filter((a) => !readAnnouncementIds.includes(a.id)).length;

  const metrics: Metric[] = [];

  if (role === "admin") {
    const openTasks = allTasks.filter((t) => t.status !== DONE_STATUS).length;
    if (openTasks > 0 && taskApp) {
      metrics.push({ key: "open-tasks", label: "Open tasks", value: openTasks, appId: taskApp.id });
    }

    const weekAgo = now - 7 * DAY;
    const newLeads = (leadsApp?.leads ?? []).filter((l) => {
      const createdAt = l.createdAt && startOfDayIso(l.createdAt);
      return createdAt && new Date(createdAt).getTime() >= weekAgo;
    }).length;
    if (newLeads > 0 && leadsApp) {
      metrics.push({ key: "new-leads", label: "New leads this week", value: newLeads, appId: leadsApp.id });
    }

    if (expiringSoon > 0 && expiringAppId) {
      metrics.push({ key: "expiring", label: "Expiring soon", value: expiringSoon, appId: expiringAppId });
    }

    if (unread > 0 && announcementsApp) {
      metrics.push({ key: "unread", label: "Unread announcements", value: unread, appId: announcementsApp.id });
    }

    // spend the one accent deliberately: at most one urgent card, in priority order
    if (overdueAll > 0) {
      const target = metrics.find((m) => m.key === "open-tasks");
      if (target) target.urgent = true;
    } else if (expiringUrgent > 0) {
      const target = metrics.find((m) => m.key === "expiring");
      if (target) target.urgent = true;
    }
  } else {
    const yourTasks = allTasks.filter(
      (t) => t.status !== DONE_STATUS && t.assignees?.includes(currentUserName),
    ).length;
    if (yourTasks > 0 && taskApp) {
      metrics.push({ key: "your-tasks", label: "Your open tasks", value: yourTasks, appId: taskApp.id });
    }

    if (unread > 0 && announcementsApp) {
      metrics.push({ key: "unread", label: "Unread announcements", value: unread, appId: announcementsApp.id });
    }

    if (overdueMine > 0) {
      const target = metrics.find((m) => m.key === "your-tasks");
      if (target) target.urgent = true;
    }
  }

  return metrics.slice(0, 4);
}
