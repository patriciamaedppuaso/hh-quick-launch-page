import { supabase } from "./supabaseClient";
import type {
  AnnouncementAttachment,
  AnnouncementRecord,
  AppTile,
  BreakEntry,
  ClockRecord,
  ContactRecord,
  LeadRecord,
  ListItem,
  ReadAnnouncements,
  Role,
  TaskRecord,
  TimeEntry,
} from "../types";

// ===================================================================
// fetch: assemble AppTile[] from the normalized tables
// ===================================================================

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const arr = map.get(k);
    if (arr) arr.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export async function fetchAllApps(): Promise<AppTile[]> {
  const [apps, items, contacts, leads, announcements, attachments, tasks, assignees, clockRecords, timeEntries, breaks] =
    await Promise.all([
      supabase.from("apps").select("*").order("sort_order"),
      supabase.from("list_items").select("*").order("sort_order"),
      supabase.from("contacts").select("*"),
      supabase.from("leads").select("*"),
      supabase.from("announcements").select("*").order("date", { ascending: false }),
      supabase.from("announcement_attachments").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("task_assignees").select("*"),
      supabase.from("clock_records").select("*"),
      supabase.from("time_entries").select("*"),
      supabase.from("time_entry_breaks").select("*"),
    ]);

  for (const res of [apps, items, contacts, leads, announcements, attachments, tasks, assignees, clockRecords, timeEntries, breaks]) {
    if (res.error) throw res.error;
  }

  const itemsByApp = groupBy(items.data ?? [], (r) => r.app_id);
  const contactsByApp = groupBy(contacts.data ?? [], (r) => r.app_id);
  const leadsByApp = groupBy(leads.data ?? [], (r) => r.app_id);
  const announcementsByApp = groupBy(announcements.data ?? [], (r) => r.app_id);
  const attachmentsByAnnouncement = groupBy(attachments.data ?? [], (r) => r.announcement_id);
  const tasksByApp = groupBy(tasks.data ?? [], (r) => r.app_id);
  const assigneesByTask = groupBy(assignees.data ?? [], (r) => r.task_id);
  const clockRecordsByApp = groupBy(clockRecords.data ?? [], (r) => r.app_id);
  const timeEntriesByApp = groupBy(timeEntries.data ?? [], (r) => r.app_id);
  const breaksByEntry = groupBy(breaks.data ?? [], (r) => r.time_entry_id);

  return (apps.data ?? []).map((row): AppTile => {
    const base = {
      id: row.id,
      name: row.name,
      initial: row.initial,
      category: row.category ?? undefined,
      description: row.description ?? undefined,
      icon: row.icon ?? undefined,
      tint: row.tint_bg && row.tint_fg ? { bg: row.tint_bg, fg: row.tint_fg } : undefined,
      builtin: row.builtin ?? undefined,
      statusOptions: (row.status_options as string[] | null) ?? undefined,
      visible: (row.visible as boolean | null) ?? true,
      contacts: (contactsByApp.get(row.id) ?? []).map(rowToContact),
      leads: (leadsByApp.get(row.id) ?? []).map(rowToLead),
      announcements: (announcementsByApp.get(row.id) ?? []).map((a) =>
        rowToAnnouncement(a, attachmentsByAnnouncement.get(a.id) ?? []),
      ),
      tasks: (tasksByApp.get(row.id) ?? []).map((t) => rowToTask(t, assigneesByTask.get(t.id) ?? [])),
      clockRecords: (clockRecordsByApp.get(row.id) ?? []).map(rowToClockRecord),
      timeEntries: (timeEntriesByApp.get(row.id) ?? []).map((e) => rowToTimeEntry(e, breaksByEntry.get(e.id) ?? [])),
    };

    if (row.type === "link") {
      return {
        ...base,
        type: "link",
        url: row.url ?? "",
        subtitle: row.subtitle ?? undefined,
        useBrandLogo: row.use_brand_logo ?? undefined,
        logoDomain: row.logo_domain ?? undefined,
        isFile: row.is_file ?? undefined,
        fileName: row.file_name ?? undefined,
      };
    }
    return {
      ...base,
      type: "list",
      items: (itemsByApp.get(row.id) ?? []).map(rowToListItem),
      unitLabel: row.unit_label ?? undefined,
    };
  });
}

export async function fetchReadAnnouncements(): Promise<ReadAnnouncements> {
  const { data, error } = await supabase.from("read_announcements").select("*");
  if (error) throw error;
  const result: ReadAnnouncements = { admin: [], employee: [] };
  for (const row of data ?? []) {
    result[row.role as Role].push(row.announcement_id);
  }
  return result;
}

export async function markAnnouncementsReadRemote(role: Role, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("read_announcements")
    .upsert(
      ids.map((announcement_id) => ({ role, announcement_id })),
      { onConflict: "role,announcement_id" },
    );
  if (error) throw error;
}

// row -> domain type -----------------------------------------------

function rowToListItem(row: Record<string, unknown>): ListItem {
  return {
    id: row.id as string,
    name: row.name as string,
    url: (row.url as string) ?? "",
    description: (row.description as string) ?? undefined,
    isFile: (row.is_file as boolean) ?? undefined,
    fileName: (row.file_name as string) ?? undefined,
    expiresOn: (row.expires_on as string) ?? undefined,
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

function rowToContact(row: Record<string, unknown>): ContactRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    role: (row.role as string) ?? undefined,
    category: (row.category as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    avatar: (row.avatar as string) ?? undefined,
  };
}

function rowToLead(row: Record<string, unknown>): LeadRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string) ?? undefined,
    status: row.status as LeadRecord["status"],
    value: (row.value as number) ?? undefined,
    followUp: (row.follow_up as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
    rep: (row.rep as string) ?? undefined,
  };
}

function rowToAnnouncement(row: Record<string, unknown>, attachmentRows: Record<string, unknown>[]): AnnouncementRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    message: row.message as string,
    date: row.date as string,
    author: (row.author as string) ?? undefined,
    attachments: attachmentRows.length > 0 ? attachmentRows.map(rowToAttachment) : undefined,
  };
}

function rowToAttachment(row: Record<string, unknown>): AnnouncementAttachment {
  return {
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    isImage: row.is_image as boolean,
  };
}

function rowToTask(row: Record<string, unknown>, assigneeRows: Record<string, unknown>[]): TaskRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as TaskRecord["status"],
    dueDate: (row.due_date as string) ?? undefined,
    priority: (row.priority as TaskRecord["priority"]) ?? undefined,
    assignees: assigneeRows.length > 0 ? assigneeRows.map((r) => r.assignee_name as string) : undefined,
  };
}

function rowToClockRecord(row: Record<string, unknown>): ClockRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    clockedIn: row.clocked_in as boolean,
    since: (row.since as string) ?? undefined,
  };
}

function rowToTimeEntry(row: Record<string, unknown>, breakRows: Record<string, unknown>[]): TimeEntry {
  const editClockIn = row.edit_request_clock_in as string | null;
  const editClockOut = row.edit_request_clock_out as string | null;
  const editNote = row.edit_request_note as string | null;
  const editRequestedAt = row.edit_request_requested_at as string | null;
  return {
    id: row.id as string,
    name: row.name as string,
    date: row.date as string,
    clockIn: row.clock_in as string,
    clockOut: (row.clock_out as string) ?? undefined,
    breaks: breakRows.map(rowToBreak),
    editRequest: editRequestedAt
      ? {
          clockIn: editClockIn ?? undefined,
          clockOut: editClockOut ?? undefined,
          note: editNote ?? undefined,
          requestedAt: editRequestedAt,
        }
      : undefined,
  };
}

function rowToBreak(row: Record<string, unknown>): BreakEntry {
  return {
    id: row.id as string,
    start: row.start_at as string,
    end: (row.end_at as string) ?? undefined,
  };
}

// ===================================================================
// write: diff two AppTile[] snapshots and push the changes
// ===================================================================

async function replaceRows(table: string, parentColumn: string, parentId: string, rows: Record<string, unknown>[]) {
  const del = await supabase.from(table).delete().eq(parentColumn, parentId);
  if (del.error) throw del.error;
  if (rows.length === 0) return;
  const ins = await supabase.from(table).insert(rows);
  if (ins.error) throw ins.error;
}

function appToRow(app: AppTile, sortOrder: number) {
  const isLink = app.type === "link";
  return {
    id: app.id,
    name: app.name,
    type: app.type,
    initial: app.initial,
    category: app.category ?? null,
    description: app.description ?? null,
    icon: app.icon ?? null,
    tint_bg: app.tint?.bg ?? null,
    tint_fg: app.tint?.fg ?? null,
    builtin: app.builtin ?? null,
    status_options: app.statusOptions ?? null,
    visible: app.visible ?? true,
    sort_order: sortOrder,
    url: isLink ? app.url : null,
    subtitle: isLink ? (app.subtitle ?? null) : null,
    use_brand_logo: isLink ? (app.useBrandLogo ?? null) : null,
    logo_domain: isLink ? (app.logoDomain ?? null) : null,
    is_file: isLink ? (app.isFile ?? null) : null,
    file_name: isLink ? (app.fileName ?? null) : null,
    unit_label: !isLink ? (app.unitLabel ?? null) : null,
  };
}

async function syncAppCollections(app: AppTile): Promise<void> {
  const work: Promise<void>[] = [];

  if (app.type === "list") {
    work.push(
      replaceRows(
        "list_items",
        "app_id",
        app.id,
        app.items.map((it) => ({
          id: it.id,
          app_id: app.id,
          name: it.name,
          url: it.url,
          description: it.description ?? null,
          is_file: it.isFile ?? null,
          file_name: it.fileName ?? null,
          expires_on: it.expiresOn ?? null,
          updated_at: it.updatedAt ?? null,
        })),
      ),
    );
  }

  if (app.contacts) {
    work.push(
      replaceRows(
        "contacts",
        "app_id",
        app.id,
        app.contacts.map((c) => ({
          id: c.id,
          app_id: app.id,
          name: c.name,
          role: c.role ?? null,
          category: c.category ?? null,
          phone: c.phone ?? null,
          email: c.email ?? null,
          notes: c.notes ?? null,
          avatar: c.avatar ?? null,
        })),
      ),
    );
  }

  if (app.leads) {
    work.push(
      replaceRows(
        "leads",
        "app_id",
        app.id,
        app.leads.map((l) => ({
          id: l.id,
          app_id: app.id,
          name: l.name,
          company: l.company ?? null,
          status: l.status,
          value: l.value ?? null,
          follow_up: l.followUp ?? null,
          notes: l.notes ?? null,
          created_at: l.createdAt ?? null,
          rep: l.rep ?? null,
        })),
      ),
    );
  }

  if (app.announcements) {
    work.push(syncAnnouncements(app.id, app.announcements));
  }

  if (app.tasks) {
    work.push(syncTasks(app.id, app.tasks));
  }

  if (app.clockRecords) {
    work.push(
      replaceRows(
        "clock_records",
        "app_id",
        app.id,
        app.clockRecords.map((c) => ({
          id: c.id,
          app_id: app.id,
          name: c.name,
          clocked_in: c.clockedIn,
          since: c.since ?? null,
        })),
      ),
    );
  }

  if (app.timeEntries) {
    work.push(syncTimeEntries(app.id, app.timeEntries));
  }

  await Promise.all(work);
}

async function syncAnnouncements(appId: string, announcements: AnnouncementRecord[]): Promise<void> {
  await replaceRows(
    "announcements",
    "app_id",
    appId,
    announcements.map((a) => ({
      id: a.id,
      app_id: appId,
      title: a.title,
      message: a.message,
      date: a.date,
      author: a.author ?? null,
    })),
  );
  await Promise.all(
    announcements.map((a) =>
      replaceRows(
        "announcement_attachments",
        "announcement_id",
        a.id,
        (a.attachments ?? []).map((att) => ({
          id: att.id,
          announcement_id: a.id,
          name: att.name,
          url: att.url,
          is_image: att.isImage,
        })),
      ),
    ),
  );
}

async function syncTasks(appId: string, tasks: TaskRecord[]): Promise<void> {
  await replaceRows(
    "tasks",
    "app_id",
    appId,
    tasks.map((t) => ({
      id: t.id,
      app_id: appId,
      title: t.title,
      status: t.status,
      due_date: t.dueDate ?? null,
      priority: t.priority ?? null,
    })),
  );
  await Promise.all(
    tasks.map((t) =>
      replaceRows(
        "task_assignees",
        "task_id",
        t.id,
        (t.assignees ?? []).map((name) => ({ task_id: t.id, assignee_name: name })),
      ),
    ),
  );
}

async function syncTimeEntries(appId: string, entries: TimeEntry[]): Promise<void> {
  await replaceRows(
    "time_entries",
    "app_id",
    appId,
    entries.map((e) => ({
      id: e.id,
      app_id: appId,
      name: e.name,
      date: e.date,
      clock_in: e.clockIn,
      clock_out: e.clockOut ?? null,
      edit_request_clock_in: e.editRequest?.clockIn ?? null,
      edit_request_clock_out: e.editRequest?.clockOut ?? null,
      edit_request_note: e.editRequest?.note ?? null,
      edit_request_requested_at: e.editRequest?.requestedAt ?? null,
    })),
  );
  await Promise.all(
    entries.map((e) =>
      replaceRows(
        "time_entry_breaks",
        "time_entry_id",
        e.id,
        e.breaks.map((b) => ({
          id: b.id,
          time_entry_id: e.id,
          start_at: b.start,
          end_at: b.end ?? null,
        })),
      ),
    ),
  );
}

/**
 * Push the difference between two AppTile[] snapshots to Supabase.
 * Called after every local state change so the UI stays instant
 * (optimistic) while the write happens in the background.
 */
export async function syncApps(prevApps: AppTile[], nextApps: AppTile[]): Promise<void> {
  const prevById = new Map(prevApps.map((a) => [a.id, a]));
  const nextIds = new Set(nextApps.map((a) => a.id));

  const removedIds = prevApps.filter((a) => !nextIds.has(a.id)).map((a) => a.id);
  const rows = nextApps.map((a, i) => appToRow(a, i));
  const touched = nextApps.filter((a) => prevById.get(a.id) !== a);

  if (removedIds.length > 0) {
    const { error } = await supabase.from("apps").delete().in("id", removedIds);
    if (error) throw error;
  }
  if (rows.length > 0) {
    const { error } = await supabase.from("apps").upsert(rows);
    if (error) throw error;
  }

  await Promise.all(touched.map((a) => syncAppCollections(a)));
}
