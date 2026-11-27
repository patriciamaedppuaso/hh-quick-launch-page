import { supabase } from "./supabaseClient";
import type {
  AccountRecord,
  AnnouncementAttachment,
  AnnouncementRecord,
  AppTile,
  BlogPostRecord,
  ClockRecord,
  ContactRecord,
  EquipmentChecklistRecord,
  InvoiceRecord,
  LeadRecord,
  ListItem,
  Punch,
  PurchaseOrderRecord,
  ReadAnnouncements,
  ReceiptRecord,
  ReceivablePayableRecord,
  RespiratoryEquipmentEntry,
  RespiratoryPatientRecord,
  Role,
  RouteStopRecord,
  TaskRecord,
  TimeOffRequest,
  VehicleInspectionRecord,
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
    leadReps,
    announcements,
    attachments,
    tasks,
    assignees,
    clockRecords,
    punches,
    timeOffRequests,
    receivablesPayables,
    blogPosts,
    accounts,
    routeStops,
    respiratoryPatients,
    respiratoryEquipment,
    invoices,
    purchaseOrders,
    vehicleInspections,
    inspectionDefects,
    equipmentChecklists,
    checklistItems,
    receipts,
  ] = await Promise.all([
    supabase.from("apps").select("*").order("sort_order"),
    supabase.from("list_items").select("*").order("sort_order"),
    supabase.from("contacts").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("lead_reps").select("*"),
    supabase.from("announcements").select("*").order("date", { ascending: false }),
    supabase.from("announcement_attachments").select("*"),
    supabase.from("tasks").select("*"),
    supabase.from("task_assignees").select("*"),
    supabase.from("clock_records").select("*"),
    supabase.from("time_punches").select("*"),
    supabase.from("time_off_requests").select("*").order("requested_at", { ascending: false }),
    supabase.from("receivables_payables").select("*"),
    supabase.from("hh_blog_posts").select("*").order("published_at", { ascending: false }),
    supabase.from("account_credentials").select("*"),
    supabase.from("route_stops").select("*").order("sort_order"),
    supabase.from("respiratory_patients").select("*"),
    supabase.from("respiratory_equipment").select("*"),
    supabase.from("printed_invoices").select("*"),
    supabase.from("purchase_order_invoices").select("*"),
    supabase.from("vehicle_inspections").select("*").order("date", { ascending: false }),
    supabase.from("vehicle_inspection_defects").select("*"),
    supabase.from("equipment_checklists").select("*").order("date", { ascending: false }),
    supabase.from("equipment_checklist_items").select("*"),
    supabase.from("receipts").select("*"),
  ]);

  for (const res of [
    apps,
    items,
    contacts,
    leads,
    leadReps,
    announcements,
    attachments,
    tasks,
    assignees,
    clockRecords,
    punches,
    timeOffRequests,
    receivablesPayables,
    blogPosts,
    accounts,
    routeStops,
    respiratoryPatients,
    respiratoryEquipment,
    invoices,
    purchaseOrders,
    vehicleInspections,
    inspectionDefects,
    equipmentChecklists,
    checklistItems,
    receipts,
  ]) {
    if (res.error) throw res.error;
  }

  const itemsByApp = groupBy(items.data ?? [], (r) => r.app_id);
  const contactsByApp = groupBy(contacts.data ?? [], (r) => r.app_id);
  const leadsByApp = groupBy(leads.data ?? [], (r) => r.app_id);
  const leadRepsByLead = groupBy(leadReps.data ?? [], (r) => r.lead_id);
  const announcementsByApp = groupBy(announcements.data ?? [], (r) => r.app_id);
  const attachmentsByAnnouncement = groupBy(attachments.data ?? [], (r) => r.announcement_id);
  const tasksByApp = groupBy(tasks.data ?? [], (r) => r.app_id);
  const assigneesByTask = groupBy(assignees.data ?? [], (r) => r.task_id);
  const clockRecordsByApp = groupBy(clockRecords.data ?? [], (r) => r.app_id);
  const punchesByApp = groupBy(punches.data ?? [], (r) => r.app_id);
  const timeOffRequestsByApp = groupBy(timeOffRequests.data ?? [], (r) => r.app_id);
  const receivablesPayablesByApp = groupBy(receivablesPayables.data ?? [], (r) => r.app_id);
  const blogPostsByApp = groupBy(blogPosts.data ?? [], (r) => r.app_id);
  const accountsByApp = groupBy(accounts.data ?? [], (r) => r.app_id);
  const routeStopsByApp = groupBy(routeStops.data ?? [], (r) => r.app_id);
  const respiratoryPatientsByApp = groupBy(respiratoryPatients.data ?? [], (r) => r.app_id);
  const respiratoryEquipmentByPatient = groupBy(respiratoryEquipment.data ?? [], (r) => r.patient_id);
  const invoicesByApp = groupBy(invoices.data ?? [], (r) => r.app_id);
  const purchaseOrdersByApp = groupBy(purchaseOrders.data ?? [], (r) => r.app_id);
  const vehicleInspectionsByApp = groupBy(vehicleInspections.data ?? [], (r) => r.app_id);
  const inspectionDefectsByInspection = groupBy(inspectionDefects.data ?? [], (r) => r.inspection_id);
  const equipmentChecklistsByApp = groupBy(equipmentChecklists.data ?? [], (r) => r.app_id);
  const checklistItemsByChecklist = groupBy(checklistItems.data ?? [], (r) => r.checklist_id);
  const receiptsByApp = groupBy(receipts.data ?? [], (r) => r.app_id);

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
      visibleRoles: (row.visible_roles as Role[] | null) ?? undefined,
      showInNav: (row.show_in_nav as boolean | null) ?? undefined,
      staffCanManage: (row.staff_can_manage as boolean | null) ?? false,
      contacts: (contactsByApp.get(row.id) ?? []).map(rowToContact),
      leads: (leadsByApp.get(row.id) ?? []).map((l) => rowToLead(l, leadRepsByLead.get(l.id as string) ?? [])),
      announcements: (announcementsByApp.get(row.id) ?? []).map((a) =>
        rowToAnnouncement(a, attachmentsByAnnouncement.get(a.id) ?? []),
      ),
      tasks: (tasksByApp.get(row.id) ?? []).map((t) => rowToTask(t, assigneesByTask.get(t.id) ?? [])),
      clockRecords: (clockRecordsByApp.get(row.id) ?? []).map(rowToClockRecord),
      punches: (punchesByApp.get(row.id) ?? []).map(rowToPunch),
      requests: (timeOffRequestsByApp.get(row.id) ?? []).map(rowToTimeOffRequest),
      receivablesPayables: (receivablesPayablesByApp.get(row.id) ?? []).map(rowToReceivablePayable),
      blogPosts: (blogPostsByApp.get(row.id) ?? []).map(rowToBlogPost),
      accounts: (accountsByApp.get(row.id) ?? []).map(rowToAccount),
      routeStops: (routeStopsByApp.get(row.id) ?? []).map(rowToRouteStop),
      respiratoryPatients: (respiratoryPatientsByApp.get(row.id) ?? []).map((p) =>
        rowToRespiratoryPatient(p, respiratoryEquipmentByPatient.get(p.id as string) ?? []),
      ),
      invoices: (invoicesByApp.get(row.id) ?? []).map(rowToInvoice),
      purchaseOrders: (purchaseOrdersByApp.get(row.id) ?? []).map(rowToPurchaseOrder),
      vehicleInspections: (vehicleInspectionsByApp.get(row.id) ?? []).map((v) =>
        rowToVehicleInspection(v, inspectionDefectsByInspection.get(v.id as string) ?? []),
      ),
      equipmentChecklists: (equipmentChecklistsByApp.get(row.id) ?? []).map((c) =>
        rowToEquipmentChecklist(c, checklistItemsByChecklist.get(c.id as string) ?? []),
      ),
      receipts: (receiptsByApp.get(row.id) ?? []).map(rowToReceipt),
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
  const result: ReadAnnouncements = { admin: [], employee: [], driver: [] };
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

function rowToLead(row: Record<string, unknown>, repRows: Record<string, unknown>[]): LeadRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string) ?? undefined,
    status: row.status as LeadRecord["status"],
    value: (row.value as number) ?? undefined,
    followUp: (row.follow_up as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
    reps: repRows.length > 0 ? repRows.map((r) => r.rep_name as string) : undefined,
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
    username: (row.username as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    password: (row.password as string) ?? undefined,
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
    finished: (row.finished as boolean) ?? undefined,
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
    checked: (row.checked as boolean) ?? false,
  };
}

function rowToPurchaseOrder(row: Record<string, unknown>): PurchaseOrderRecord {
  return {
    id: row.id as string,
    folder: (row.folder as string) ?? undefined,
    name: row.name as string,
    url: (row.url as string) ?? undefined,
    isFile: (row.is_file as boolean) ?? undefined,
    fileName: (row.file_name as string) ?? undefined,
    status: row.status as PurchaseOrderRecord["status"],
  };
}

function rowToReceipt(row: Record<string, unknown>): ReceiptRecord {
  return {
    id: row.id as string,
    folder: (row.folder as string) ?? undefined,
    name: row.name as string,
    amount: (row.amount as number) ?? undefined,
    url: (row.url as string) ?? undefined,
    isFile: (row.is_file as boolean) ?? undefined,
    fileName: (row.file_name as string) ?? undefined,
    status: row.status as ReceiptRecord["status"],
  };
}

function rowToVehicleInspection(
  row: Record<string, unknown>,
  defectRows: Record<string, unknown>[],
): VehicleInspectionRecord {
  return {
    id: row.id as string,
    driverName: row.driver_name as string,
    date: row.date as string,
    tripType: row.trip_type as VehicleInspectionRecord["tripType"],
    location: (row.location as string) ?? undefined,
    licensePlate: (row.license_plate as string) ?? undefined,
    vehicle: (row.vehicle as string) ?? undefined,
    odometer: (row.odometer as number) ?? undefined,
    defectiveItems: defectRows.map((d) => d.item_name as string),
    remarks: (row.remarks as string) ?? undefined,
    conditionAcceptable: row.condition_acceptable as boolean,
    certified: row.certified as boolean,
  };
}

function rowToEquipmentChecklist(
  row: Record<string, unknown>,
  itemRows: Record<string, unknown>[],
): EquipmentChecklistRecord {
  return {
    id: row.id as string,
    employeeName: row.employee_name as string,
    date: row.date as string,
    confirmedItems: itemRows.map((r) => ({
      name: r.item_name as string,
      quantity: (r.quantity as number) ?? 1,
    })),
    certified: row.certified as boolean,
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
    notes: (row.notes as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
  };
}

function rowToTimeOffRequest(row: Record<string, unknown>): TimeOffRequest {
  return {
    id: row.id as string,
    employeeName: row.employee_name as string,
    type: row.type as TimeOffRequest["type"],
    date: row.date as string,
    endDate: (row.end_date as string) ?? undefined,
    startTime: (row.start_time as string) ?? undefined,
    endTime: (row.end_time as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    status: row.status as TimeOffRequest["status"],
    requestedAt: row.requested_at as string,
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

function rowToPunch(row: Record<string, unknown>): Punch {
  const editStart = row.edit_request_start as string | null;
  const editEnd = row.edit_request_end as string | null;
  const editNote = row.edit_request_note as string | null;
  const editRequestedAt = row.edit_request_requested_at as string | null;
  return {
    id: row.id as string,
    name: row.name as string,
    date: row.date as string,
    type: row.type as Punch["type"],
    start: row.start_at as string,
    end: (row.end_at as string) ?? undefined,
    editRequest: editRequestedAt
      ? {
          start: editStart ?? undefined,
          end: editEnd ?? undefined,
          note: editNote ?? undefined,
          requestedAt: editRequestedAt,
        }
      : undefined,
  };
}

// ===================================================================
// write: diff two AppTile[] snapshots and push the changes
// ===================================================================

/** Insert-or-update by primary key, without deleting anything first -- use this for a
 * collection that's never removed wholesale, to avoid an unnecessary delete (and any
 * ON DELETE CASCADE it could trigger on a related table) for a plain update. */
async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw error;
}

/** Diffs against the collection's own previous state and only deletes what's
 * actually been removed, then upserts the rest -- never a blanket
 * delete-everything-then-reinsert of a whole parent's collection the way
 * replaceRows does. A stale or momentarily-incomplete local copy can then at
 * worst fail to delete something real; it can no longer silently wipe rows
 * it simply didn't know about (this is what replaceRows did to every
 * driver's route_stops -- see 0054's write path for the incident this
 * replaced it for, now generalized everywhere else replaceRows was used).
 *
 * keyColumn is "id" for a table with its own id column, or the row's own
 * natural key column (e.g. "rep_name") for a child table whose primary key
 * is a composite of (parentColumn, keyColumn) -- either way it must uniquely
 * identify a row within this one parent's collection. */
async function syncScoped<T>(
  table: string,
  parentColumn: string,
  parentId: string,
  keyColumn: string,
  prevRows: T[] | undefined,
  nextRows: T[],
  getKey: (item: T) => string,
  toRow: (item: T) => Record<string, unknown>,
  options?: { onlyChanged?: boolean },
): Promise<void> {
  const nextKeys = new Set(nextRows.map(getKey));
  const removedKeys = (prevRows ?? []).map(getKey).filter((k) => !nextKeys.has(k));

  if (removedKeys.length > 0) {
    const { error } = await supabase.from(table).delete().eq(parentColumn, parentId).in(keyColumn, removedKeys);
    if (error) throw error;
  }
  const rowsToWrite = options?.onlyChanged ? changedItems(prevRows, nextRows, getKey) : nextRows;
  if (rowsToWrite.length === 0) return;
  const onConflict = keyColumn === "id" ? "id" : `${parentColumn},${keyColumn}`;
  const { error } = await supabase.from(table).upsert(rowsToWrite.map(toRow), { onConflict });
  if (error) throw error;
}

/** Items in `next` that are new or were replaced (by reference) since `prev`.
 * Every state update in this app is immutable (`{ ...p, end }`), so an
 * untouched item keeps its exact object identity. Writing back only these
 * means a tab whose copy of *other* rows is stale can't overwrite them. */
function changedItems<T>(prev: T[] | undefined, next: T[], getKey: (item: T) => string): T[] {
  if (!prev) return next;
  const prevByKey = new Map(prev.map((item) => [getKey(item), item]));
  return next.filter((item) => prevByKey.get(getKey(item)) !== item);
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
    visible_roles: app.visibleRoles ?? null,
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

async function syncAppCollections(app: AppTile, prevApp?: AppTile): Promise<void> {
  const work: Promise<void>[] = [];

  if (app.type === "list") {
    work.push(
      syncScoped(
        "list_items",
        "app_id",
        app.id,
        "id",
        prevApp?.type === "list" ? prevApp.items : undefined,
        app.items,
        (it) => it.id,
        (it) => ({
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
        }),
      ),
    );
  }

  if (app.contacts) {
    work.push(
      syncScoped(
        "contacts",
        "app_id",
        app.id,
        "id",
        prevApp?.contacts,
        app.contacts,
        (c) => c.id,
        (c) => ({
          id: c.id,
          app_id: app.id,
          name: c.name,
          role: c.role ?? null,
          category: c.category ?? null,
          phone: c.phone ?? null,
          email: c.email ?? null,
          notes: c.notes ?? null,
          avatar: c.avatar ?? null,
        }),
      ),
    );
  }

  if (app.leads) {
    work.push(syncLeads(app.id, prevApp?.leads, app.leads));
  }

  if (app.announcements) {
    work.push(syncAnnouncements(app.id, prevApp?.announcements, app.announcements));
  }

  if (app.tasks) {
    work.push(syncTasks(app.id, prevApp?.tasks, app.tasks));
  }

  if (app.clockRecords) {
    work.push(
      syncScoped(
        "clock_records",
        "app_id",
        app.id,
        "id",
        prevApp?.clockRecords,
        app.clockRecords,
        (c) => c.id,
        (c) => ({
          id: c.id,
          app_id: app.id,
          name: c.name,
          clocked_in: c.clockedIn,
          since: c.since ?? null,
        }),
        { onlyChanged: true },
      ),
    );
  }

  if (app.punches) {
    work.push(syncPunches(app.id, prevApp?.punches, app.punches));
  }

  if (app.requests) {
    work.push(
      syncScoped(
        "time_off_requests",
        "app_id",
        app.id,
        "id",
        prevApp?.requests,
        app.requests,
        (r) => r.id,
        (r) => ({
          id: r.id,
          app_id: app.id,
          employee_name: r.employeeName,
          type: r.type,
          date: r.date,
          end_date: r.endDate ?? null,
          start_time: r.startTime ?? null,
          end_time: r.endTime ?? null,
          note: r.note ?? null,
          status: r.status,
          requested_at: r.requestedAt,
        }),
      ),
    );
  }

  if (app.receivablesPayables) {
    work.push(
      syncScoped(
        "receivables_payables",
        "app_id",
        app.id,
        "id",
        prevApp?.receivablesPayables,
        app.receivablesPayables,
        (r) => r.id,
        (r) => ({
          id: r.id,
          app_id: app.id,
          kind: r.kind,
          party: r.party,
          amount: r.amount,
          status: r.status,
          due_date: r.dueDate ?? null,
          notes: r.notes ?? null,
          created_at: r.createdAt ?? null,
        }),
      ),
    );
  }

  if (app.accounts) {
    work.push(
      syncScoped(
        "account_credentials",
        "app_id",
        app.id,
        "id",
        prevApp?.accounts,
        app.accounts,
        (a) => a.id,
        (a) => ({
          id: a.id,
          app_id: app.id,
          name: a.name,
          category: a.category ?? null,
          username: a.username ?? null,
          email: a.email ?? null,
          password: a.password ?? null,
          url: a.url ?? null,
          notes: a.notes ?? null,
          updated_at: a.updatedAt ?? null,
        }),
      ),
    );
  }

  if (app.routeStops) {
    work.push(syncRouteStops(app.id, prevApp?.routeStops, app.routeStops));
  }

  if (app.respiratoryPatients) {
    work.push(syncRespiratoryPatients(app.id, prevApp?.respiratoryPatients, app.respiratoryPatients));
  }

  if (app.invoices) {
    work.push(
      syncScoped(
        "printed_invoices",
        "app_id",
        app.id,
        "id",
        prevApp?.invoices,
        app.invoices,
        (inv) => inv.id,
        (inv) => ({
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
          checked: inv.checked ?? false,
        }),
      ),
    );
  }

  if (app.vehicleInspections) {
    work.push(syncVehicleInspections(app.id, prevApp?.vehicleInspections, app.vehicleInspections));
  }

  if (app.equipmentChecklists) {
    work.push(syncEquipmentChecklists(app.id, prevApp?.equipmentChecklists, app.equipmentChecklists));
  }

  if (app.purchaseOrders) {
    work.push(
      syncScoped(
        "purchase_order_invoices",
        "app_id",
        app.id,
        "id",
        prevApp?.purchaseOrders,
        app.purchaseOrders,
        (po) => po.id,
        (po) => ({
          id: po.id,
          app_id: app.id,
          folder: po.folder ?? null,
          name: po.name,
          url: po.url ?? null,
          is_file: po.isFile ?? null,
          file_name: po.fileName ?? null,
          status: po.status,
        }),
      ),
    );
  }

  if (app.receipts) {
    work.push(
      syncScoped(
        "receipts",
        "app_id",
        app.id,
        "id",
        prevApp?.receipts,
        app.receipts,
        (r) => r.id,
        (r) => ({
          id: r.id,
          app_id: app.id,
          folder: r.folder ?? null,
          name: r.name,
          amount: r.amount ?? null,
          url: r.url ?? null,
          is_file: r.isFile ?? null,
          file_name: r.fileName ?? null,
          status: r.status,
        }),
      ),
    );
  }

  if (app.blogPosts) {
    work.push(
      syncScoped(
        "hh_blog_posts",
        "app_id",
        app.id,
        "id",
        prevApp?.blogPosts,
        app.blogPosts,
        (p) => p.id,
        (p) => ({
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
        }),
      ),
    );
  }

  await Promise.all(work);
}

async function syncAnnouncements(
  appId: string,
  prevAnnouncements: AnnouncementRecord[] | undefined,
  announcements: AnnouncementRecord[],
): Promise<void> {
  await syncScoped(
    "announcements",
    "app_id",
    appId,
    "id",
    prevAnnouncements,
    announcements,
    (a) => a.id,
    (a) => ({
      id: a.id,
      app_id: appId,
      title: a.title,
      message: a.message,
      date: a.date,
      author: a.author ?? null,
    }),
  );
  const prevById = new Map((prevAnnouncements ?? []).map((a) => [a.id, a]));
  await Promise.all(
    announcements.map((a) =>
      syncScoped(
        "announcement_attachments",
        "announcement_id",
        a.id,
        "id",
        prevById.get(a.id)?.attachments,
        a.attachments ?? [],
        (att) => att.id,
        (att) => ({
          id: att.id,
          announcement_id: a.id,
          name: att.name,
          url: att.url,
          is_image: att.isImage,
        }),
      ),
    ),
  );
}

async function syncLeads(appId: string, prevLeads: LeadRecord[] | undefined, leads: LeadRecord[]): Promise<void> {
  await syncScoped(
    "leads",
    "app_id",
    appId,
    "id",
    prevLeads,
    leads,
    (l) => l.id,
    (l) => ({
      id: l.id,
      app_id: appId,
      name: l.name,
      company: l.company ?? null,
      status: l.status,
      value: l.value ?? null,
      follow_up: l.followUp ?? null,
      notes: l.notes ?? null,
      created_at: l.createdAt ?? null,
    }),
  );
  const prevById = new Map((prevLeads ?? []).map((l) => [l.id, l]));
  await Promise.all(
    leads.map((l) =>
      syncScoped(
        "lead_reps",
        "lead_id",
        l.id,
        "rep_name",
        prevById.get(l.id)?.reps,
        l.reps ?? [],
        (name) => name,
        (name) => ({ lead_id: l.id, rep_name: name }),
      ),
    ),
  );
}

async function syncTasks(appId: string, prevTasks: TaskRecord[] | undefined, tasks: TaskRecord[]): Promise<void> {
  await syncScoped(
    "tasks",
    "app_id",
    appId,
    "id",
    prevTasks,
    tasks,
    (t) => t.id,
    (t) => ({
      id: t.id,
      app_id: appId,
      title: t.title,
      status: t.status,
      due_date: t.dueDate ?? null,
      priority: t.priority ?? null,
      notes: t.notes ?? null,
      created_at: t.createdAt ?? null,
    }),
  );
  const prevById = new Map((prevTasks ?? []).map((t) => [t.id, t]));
  await Promise.all(
    tasks.map((t) =>
      syncScoped(
        "task_assignees",
        "task_id",
        t.id,
        "assignee_name",
        prevById.get(t.id)?.assignees,
        t.assignees ?? [],
        (name) => name,
        (name) => ({ task_id: t.id, assignee_name: name }),
      ),
    ),
  );
}

async function syncVehicleInspections(
  appId: string,
  prevInspections: VehicleInspectionRecord[] | undefined,
  inspections: VehicleInspectionRecord[],
): Promise<void> {
  await syncScoped(
    "vehicle_inspections",
    "app_id",
    appId,
    "id",
    prevInspections,
    inspections,
    (v) => v.id,
    (v) => ({
      id: v.id,
      app_id: appId,
      driver_name: v.driverName,
      date: v.date,
      trip_type: v.tripType,
      location: v.location ?? null,
      license_plate: v.licensePlate ?? null,
      vehicle: v.vehicle ?? null,
      odometer: v.odometer ?? null,
      remarks: v.remarks ?? null,
      condition_acceptable: v.conditionAcceptable,
      certified: v.certified,
    }),
  );
  const prevById = new Map((prevInspections ?? []).map((v) => [v.id, v]));
  await Promise.all(
    inspections.map((v) =>
      syncScoped(
        "vehicle_inspection_defects",
        "inspection_id",
        v.id,
        "item_name",
        prevById.get(v.id)?.defectiveItems,
        v.defectiveItems,
        (item) => item,
        (item) => ({ inspection_id: v.id, item_name: item }),
      ),
    ),
  );
}

async function syncEquipmentChecklists(
  appId: string,
  prevChecklists: EquipmentChecklistRecord[] | undefined,
  checklists: EquipmentChecklistRecord[],
): Promise<void> {
  await syncScoped(
    "equipment_checklists",
    "app_id",
    appId,
    "id",
    prevChecklists,
    checklists,
    (c) => c.id,
    (c) => ({
      id: c.id,
      app_id: appId,
      employee_name: c.employeeName,
      date: c.date,
      certified: c.certified,
    }),
  );
  const prevById = new Map((prevChecklists ?? []).map((c) => [c.id, c]));
  await Promise.all(
    checklists.map((c) =>
      syncScoped(
        "equipment_checklist_items",
        "checklist_id",
        c.id,
        "item_name",
        prevById.get(c.id)?.confirmedItems,
        c.confirmedItems,
        (item) => item.name,
        (item) => ({
          checklist_id: c.id,
          item_name: item.name,
          quantity: item.quantity,
        }),
      ),
    ),
  );
}

// Unlike replaceRows, never deletes everything-then-reinserts -- that pattern
// is exactly what silently wiped every driver's route stops before: a stale
// tab's locally-held copy only needs to be briefly incomplete at save time
// for the blanket delete to remove real rows that the equally-blanket
// reinsert then fails to restore. Instead, diff against what this same app
// looked like *before* this save (prevStops) to find only the stop(s)
// actually removed, delete just those, and upsert everything else --
// so a stale/incomplete local copy can at worst fail to delete something,
// never wipe rows it never knew about to begin with.
async function syncRouteStops(
  appId: string,
  prevStops: RouteStopRecord[] | undefined,
  nextStops: RouteStopRecord[],
): Promise<void> {
  const nextIds = new Set(nextStops.map((s) => s.id));
  const removedIds = (prevStops ?? []).map((s) => s.id).filter((id) => !nextIds.has(id));

  if (removedIds.length > 0) {
    const { error } = await supabase.from("route_stops").delete().in("id", removedIds);
    if (error) throw error;
  }

  await upsertRows(
    "route_stops",
    nextStops.map((s, i) => ({
      id: s.id,
      app_id: appId,
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
      finished: s.finished ?? false,
      sort_order: i,
    })),
  );
}

async function syncRespiratoryPatients(
  appId: string,
  prevPatients: RespiratoryPatientRecord[] | undefined,
  patients: RespiratoryPatientRecord[],
): Promise<void> {
  await syncScoped(
    "respiratory_patients",
    "app_id",
    appId,
    "id",
    prevPatients,
    patients,
    (p) => p.id,
    (p) => ({
      id: p.id,
      app_id: appId,
      folder: p.folder ?? null,
      patient_name: p.patientName,
      city: p.city ?? null,
      due_date: p.dueDate ?? null,
      log_date: p.logDate ?? null,
    }),
  );
  const prevById = new Map((prevPatients ?? []).map((p) => [p.id, p]));
  await Promise.all(
    patients.map((p) =>
      syncScoped(
        "respiratory_equipment",
        "patient_id",
        p.id,
        "id",
        prevById.get(p.id)?.equipment,
        p.equipment,
        (e) => e.id,
        (e) => ({ id: e.id, patient_id: p.id, name: e.name, status: e.status }),
      ),
    ),
  );
}

function punchToRow(appId: string, p: Punch) {
  return {
    id: p.id,
    app_id: appId,
    name: p.name,
    date: p.date,
    type: p.type,
    start_at: p.start,
    end_at: p.end ?? null,
    edit_request_start: p.editRequest?.start ?? null,
    edit_request_end: p.editRequest?.end ?? null,
    edit_request_note: p.editRequest?.note ?? null,
    edit_request_requested_at: p.editRequest?.requestedAt ?? null,
  };
}

// Upsert-only (there's no UI path that removes a punch), and ONLY the punches
// this change actually touched. Upserting the tab's whole punch list used to
// let any tab that hadn't yet reloaded someone else's clock-out write that
// punch back with end_at = null -- re-opening it. That is how several people
// clocking out within moments of each other (Nov 25, 2026) left everyone's
// shift running until they ended it again on their next shift.
async function syncPunches(appId: string, prevPunches: Punch[] | undefined, punches: Punch[]): Promise<void> {
  await upsertRows(
    "time_punches",
    changedItems(prevPunches, punches, (p) => p.id).map((p) => punchToRow(appId, p)),
  );
}

/**
 * Plain INSERT (never upsert) for the two actions that OPEN a punch (Start
 * Shift, the open half of Start Break). Must be awaited and resolved before
 * the optimistic local state update, so that a stale tab racing another
 * open punch for the same person hits the database's partial unique index
 * (time_punches_one_open_per_person) and fails loudly with a 23505 instead
 * of silently succeeding.
 */
export async function insertOpenPunch(appId: string, punch: Punch): Promise<void> {
  const { error } = await supabase.from("time_punches").insert(punchToRow(appId, punch));
  if (error) throw error;
}

export function isOpenPunchConflict(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505";
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

  // `apps` is realtime-watched (see SYNCED_TABLES in App.tsx): writing to it
  // triggers a debounced full reload in every open tab. A brand new app's
  // row has to exist first so its own collection rows (which reference it
  // via a foreign key) can insert -- but for everything else, write the
  // collections *before* touching `apps`, so that debounced reload (which
  // can land before a collection's own delete-then-reinsert finishes)
  // always reads complete data instead of catching it mid-write.
  const newAppRows = rows.filter((r) => !prevById.has(r.id as string));
  if (newAppRows.length > 0) {
    const { error } = await supabase.from("apps").upsert(newAppRows);
    if (error) throw error;
  }

  if (removedIds.length > 0) {
    const { error } = await supabase.from("apps").delete().in("id", removedIds);
    if (error) throw error;
  }

  await Promise.all(touched.map((a) => syncAppCollections(a, prevById.get(a.id))));

  const existingRows = rows.filter((r) => prevById.has(r.id as string));
  if (existingRows.length > 0) {
    const { error } = await supabase.from("apps").upsert(existingRows);
    if (error) throw error;
  }
}
