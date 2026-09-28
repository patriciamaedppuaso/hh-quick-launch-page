import { supabase } from "./supabaseClient";
import type {
  AccountRecord,
  AnnouncementAttachment,
  AnnouncementRecord,
  AppTile,
  BlogPostRecord,
  BreakEntry,
  ClockRecord,
  ContactRecord,
  InvoiceRecord,
  LeadRecord,
  ListItem,
  ReadAnnouncements,
  ReceivablePayableRecord,
  RespiratoryEquipmentEntry,
  RespiratoryPatientRecord,
  Role,
  RouteStopRecord,
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
  const [
    apps,
    items,
    contacts,
    leads,
    announcements,
    attachments,
    tasks,
    assignees,
    clockRecords,
    timeEntries,
    breaks,
    receivablesPayables,
    blogPosts,
    accounts,
    routeStops,
    respiratoryPatients,
    respiratoryEquipment,
    invoices,
  ] = await Promise.all([
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
    supabase.from("receivables_payables").select("*"),
    supabase.from("hh_blog_posts").select("*").order("published_at", { ascending: false }),
    supabase.from("account_credentials").select("*"),
    supabase.from("route_stops").select("*"),
    supabase.from("respiratory_patients").select("*"),
    supabase.from("respiratory_equipment").select("*"),
    supabase.from("printed_invoices").select("*"),
  ]);

  for (const res of [
    apps,
    items,
    contacts,
    leads,
    announcements,
    attachments,
    tasks,
    assignees,
    clockRecords,
    timeEntries,
    breaks,
    receivablesPayables,
    blogPosts,
    accounts,
    routeStops,
    respiratoryPatients,
    respiratoryEquipment,
    invoices,
  ]) {
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
  const receivablesPayablesByApp = groupBy(receivablesPayables.data ?? [], (r) => r.app_id);
  const blogPostsByApp = groupBy(blogPosts.data ?? [], (r) => r.app_id);
  const accountsByApp = groupBy(accounts.data ?? [], (r) => r.app_id);
  const routeStopsByApp = groupBy(routeStops.data ?? [], (r) => r.app_id);
  const respiratoryPatientsByApp = groupBy(respiratoryPatients.data ?? [], (r) => r.app_id);
  const respiratoryEquipmentByPatient = groupBy(respiratoryEquipment.data ?? [], (r) => r.patient_id);
  const invoicesByApp = groupBy(invoices.data ?? [], (r) => r.app_id);

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
      showInNav: (row.show_in_nav as boolean | null) ?? undefined,
      staffCanManage: (row.staff_can_manage as boolean | null) ?? false,
      contacts: (contactsByApp.get(row.id) ?? []).map(rowToContact),
      leads: (leadsByApp.get(row.id) ?? []).map(rowToLead),
      announcements: (announcementsByApp.get(row.id) ?? []).map((a) =>
        rowToAnnouncement(a, attachmentsByAnnouncement.get(a.id) ?? []),
      ),
      tasks: (tasksByApp.get(row.id) ?? []).map((t) => rowToTask(t, assigneesByTask.get(t.id) ?? [])),
      clockRecords: (clockRecordsByApp.get(row.id) ?? []).map(rowToClockRecord),
      timeEntries: (timeEntriesByApp.get(row.id) ?? []).map((e) => rowToTimeEntry(e, breaksByEntry.get(e.id) ?? [])),
      receivablesPayables: (receivablesPayablesByApp.get(row.id) ?? []).map(rowToReceivablePayable),
      blogPosts: (blogPostsByApp.get(row.id) ?? []).map(rowToBlogPost),
      accounts: (accountsByApp.get(row.id) ?? []).map(rowToAccount),
      routeStops: (routeStopsByApp.get(row.id) ?? []).map(rowToRouteStop),
      respiratoryPatients: (respiratoryPatientsByApp.get(row.id) ?? []).map((p) =>
        rowToRespiratoryPatient(p, respiratoryEquipmentByPatient.get(p.id as string) ?? []),
      ),
      invoices: (invoicesByApp.get(row.id) ?? []).map(rowToInvoice),
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
    folder: (row.folder as string) ?? undefined,
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

function rowToReceivablePayable(row: Record<string, unknown>): ReceivablePayableRecord {
  return {
    id: row.id as string,
    kind: row.kind as ReceivablePayableRecord["kind"],
    party: row.party as string,
    amount: (row.amount as number) ?? 0,
    status: row.status as string,
    dueDate: (row.due_date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
  };
}

function rowToAccount(row: Record<string, unknown>): AccountRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? undefined,
    email: row.email as string,
    password: row.password as string,
    url: (row.url as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

function rowToRouteStop(row: Record<string, unknown>): RouteStopRecord {
  return {
    id: row.id as string,
    driver: row.driver as string,
    date: row.date as string,
    startTime: (row.start_time as string) ?? undefined,
    endTime: (row.end_time as string) ?? undefined,
    mileage: (row.mileage as number) ?? undefined,
    customerName: row.customer_name as string,
    street: (row.street as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    driverEta: (row.driver_eta as string) ?? undefined,
    scheduleEta: (row.schedule_eta as string) ?? undefined,
    servicePerformed: (row.service_performed as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    flagged: (row.flagged as boolean) ?? undefined,
  };
}

function rowToEquipment(row: Record<string, unknown>): RespiratoryEquipmentEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as RespiratoryEquipmentEntry["status"],
  };
}

function rowToRespiratoryPatient(
  row: Record<string, unknown>,
  equipmentRows: Record<string, unknown>[],
): RespiratoryPatientRecord {
  return {
    id: row.id as string,
    folder: (row.folder as string) ?? undefined,
    patientName: row.patient_name as string,
    city: (row.city as string) ?? undefined,
    equipment: equipmentRows.map(rowToEquipment),
    dueDate: (row.due_date as string) ?? undefined,
    logDate: (row.log_date as string) ?? undefined,
  };
}

function rowToInvoice(row: Record<string, unknown>): InvoiceRecord {
  return {
    id: row.id as string,
    folder: (row.folder as string) ?? undefined,
    patientName: row.patient_name as string,
    address: (row.address as string) ?? undefined,
    hospice: (row.hospice as string) ?? undefined,
    orderType: row.order_type as InvoiceRecord["orderType"],
    notes: (row.notes as string) ?? undefined,
    status: row.status as InvoiceRecord["status"],
    date: row.date as string,
  };
}

function rowToBlogPost(row: Record<string, unknown>): BlogPostRecord {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? undefined,
    content: row.content as string,
    coverImageUrl: (row.cover_image_url as string) ?? undefined,
    authorName: (row.author_name as string) ?? undefined,
    isActive: row.is_active as boolean,
    publishedAt: (row.published_at as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
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
    show_in_nav: app.showInNav ?? null,
    staff_can_manage: app.staffCanManage ?? false,
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
          folder: it.folder ?? null,
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

  if (app.receivablesPayables) {
    work.push(
      replaceRows(
        "receivables_payables",
        "app_id",
        app.id,
        app.receivablesPayables.map((r) => ({
          id: r.id,
          app_id: app.id,
          kind: r.kind,
          party: r.party,
          amount: r.amount,
          status: r.status,
          due_date: r.dueDate ?? null,
          notes: r.notes ?? null,
          created_at: r.createdAt ?? null,
        })),
      ),
    );
  }

  if (app.accounts) {
    work.push(
      replaceRows(
        "account_credentials",
        "app_id",
        app.id,
        app.accounts.map((a) => ({
          id: a.id,
          app_id: app.id,
          name: a.name,
          category: a.category ?? null,
          email: a.email,
          password: a.password,
          url: a.url ?? null,
          notes: a.notes ?? null,
          updated_at: a.updatedAt ?? null,
        })),
      ),
    );
  }

  if (app.routeStops) {
    work.push(
      replaceRows(
        "route_stops",
        "app_id",
        app.id,
        app.routeStops.map((s) => ({
          id: s.id,
          app_id: app.id,
          driver: s.driver,
          date: s.date,
          start_time: s.startTime ?? null,
          end_time: s.endTime ?? null,
          mileage: s.mileage ?? null,
          customer_name: s.customerName,
          street: s.street ?? null,
          city: s.city ?? null,
          driver_eta: s.driverEta ?? null,
          schedule_eta: s.scheduleEta ?? null,
          service_performed: s.servicePerformed ?? null,
          note: s.note ?? null,
          flagged: s.flagged ?? false,
        })),
      ),
    );
  }

  if (app.respiratoryPatients) {
    work.push(syncRespiratoryPatients(app.id, app.respiratoryPatients));
  }

  if (app.invoices) {
    work.push(
      replaceRows(
        "printed_invoices",
        "app_id",
        app.id,
        app.invoices.map((inv) => ({
          id: inv.id,
          app_id: app.id,
          folder: inv.folder ?? null,
          patient_name: inv.patientName,
          address: inv.address ?? null,
          hospice: inv.hospice ?? null,
          order_type: inv.orderType,
          notes: inv.notes ?? null,
          status: inv.status,
          date: inv.date,
        })),
      ),
    );
  }

  if (app.blogPosts) {
    work.push(
      replaceRows(
        "hh_blog_posts",
        "app_id",
        app.id,
        app.blogPosts.map((p) => ({
          id: p.id,
          app_id: app.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt ?? null,
          content: p.content,
          cover_image_url: p.coverImageUrl ?? null,
          author_name: p.authorName ?? null,
          is_active: p.isActive,
          published_at: p.publishedAt ?? null,
          created_at: p.createdAt ?? null,
        })),
      ),
    );
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

async function syncRespiratoryPatients(appId: string, patients: RespiratoryPatientRecord[]): Promise<void> {
  await replaceRows(
    "respiratory_patients",
    "app_id",
    appId,
    patients.map((p) => ({
      id: p.id,
      app_id: appId,
      folder: p.folder ?? null,
      patient_name: p.patientName,
      city: p.city ?? null,
      due_date: p.dueDate ?? null,
      log_date: p.logDate ?? null,
    })),
  );
  await Promise.all(
    patients.map((p) =>
      replaceRows(
        "respiratory_equipment",
        "patient_id",
        p.id,
        p.equipment.map((e) => ({ id: e.id, patient_id: p.id, name: e.name, status: e.status })),
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
