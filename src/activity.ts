import type { AppTile } from "./types";
import { formatDate } from "./utils";

export interface ActivityEntry {
  key: string;
  label: string;
  meta: string;
  appId: string;
  sortKey: string;
}

export function getActivityFeed(apps: AppTile[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  const announcementsApp = apps.find((a) => a.builtin === "announcements");
  const latestAnnouncement = [...(announcementsApp?.announcements ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  if (latestAnnouncement && announcementsApp) {
    entries.push({
      key: "announcement",
      label: latestAnnouncement.title,
      meta: `Announcement · ${formatDate(latestAnnouncement.date)}`,
      appId: announcementsApp.id,
      sortKey: latestAnnouncement.date,
    });
  }

  const leadsApp = apps.find((a) => a.builtin === "leads");
  const latestLead = [...(leadsApp?.leads ?? [])]
    .filter((l) => l.createdAt)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  if (latestLead && leadsApp) {
    entries.push({
      key: "lead",
      label: `New lead: ${latestLead.name}`,
      meta: `Leads · ${formatDate(latestLead.createdAt)}`,
      appId: leadsApp.id,
      sortKey: latestLead.createdAt ?? "",
    });
  }

  let latestItemDate = "";
  let latestItemLabel = "";
  let latestItemAppId = "";
  for (const app of apps) {
    if (app.type !== "list" || app.builtin) continue;
    for (const item of app.items) {
      if (item.updatedAt && item.updatedAt > latestItemDate) {
        latestItemDate = item.updatedAt;
        latestItemLabel = item.name;
        latestItemAppId = app.id;
      }
    }
  }
  if (latestItemDate) {
    entries.push({
      key: "item",
      label: latestItemLabel,
      meta: `Updated · ${formatDate(latestItemDate)}`,
      appId: latestItemAppId,
      sortKey: latestItemDate,
    });
  }

  return entries.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 3);
}
