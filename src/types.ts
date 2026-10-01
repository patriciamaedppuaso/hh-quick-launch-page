export type Role = "admin" | "employee";

export type ReadAnnouncements = Record<Role, string[]>;

export type Theme = "light" | "dark" | "system";

export type ViewMode = "list" | "grid";

export type IconName =
  | "clock"
  | "briefcase"
  | "message"
  | "dollar"
  | "cloud"
  | "file"
  | "phone"
  | "check-square"
  | "megaphone"
  | "book"
  | "users"
  | "user-plus"
  | "sun"
  | "moon"
  | "monitor"
  | "pin"
  | "list"
  | "grid"
  | "grip"
  | "search"
  | "arrow-left"
  | "edit"
  | "trash"
  | "mail"
  | "home"
  | "plus"
  | "menu"
  | "folder"
  | "chevron-right"
  | "alert-circle"
  | "newspaper"
  | "key"
  | "eye"
  | "eye-off"
  | "copy"
  | "external-link"
  | "truck"
  | "lungs"
  | "receipt"
  | "clipboard";

export interface Tint {
  bg: string;
  fg: string;
}

export interface ListItem {
  id: string;
  name: string;
  url: string;
  description?: string;
  isFile?: boolean;
  fileName?: string;
  expiresOn?: string;
  updatedAt?: string;
  /** Which folder this item sits in, when the app has folders enabled. Undefined = no folder. */
  folder?: string;
}

export type BuiltinKind =
  | "contacts"
  | "leads"
  | "announcements"
  | "tasks"
  | "timeclock"
  | "users"
  | "receivables"
  | "blog"
  | "accounts"
  | "routes"
  | "respiratory"
  | "invoices"
  | "purchaseOrders"
  | "vehicleInspections"
  | "equipmentChecklist";

export interface ContactRecord {
  id: string;
  name: string;
  role?: string;
  category?: string;
  phone?: string;
  email?: string;
  notes?: string;
  avatar?: string;
}

export type LeadStatus = string;

export interface LeadRecord {
  id: string;
  name: string;
  company?: string;
  status: LeadStatus;
  value?: number;
  followUp?: string;
  notes?: string;
  createdAt?: string;
  rep?: string;
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  isImage: boolean;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  date: string;
  author?: string;
  attachments?: AnnouncementAttachment[];
}

export type TaskStatus = string;
export type TaskPriority = "low" | "medium" | "high";

export interface TaskRecord {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignees?: string[];
  priority?: TaskPriority;
  notes?: string;
}

export type RpKind = "receivable" | "payable";

export interface ReceivablePayableRecord {
  id: string;
  kind: RpKind;
  /** Who owes the money (payable) or who owes it to us (receivable). */
  party: string;
  amount: number;
  status: string;
  dueDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface AccountRecord {
  id: string;
  name: string;
  category?: string;
  email: string;
  password: string;
  url?: string;
  notes?: string;
  updatedAt?: string;
}

export interface RouteStopRecord {
  id: string;
  driver: string;
  date: string;
  startTime?: string;
  endTime?: string;
  mileage?: number;
  customerName: string;
  street?: string;
  city?: string;
  driverEta?: string;
  scheduleEta?: string;
  servicePerformed?: string;
  note?: string;
  flagged?: boolean;
  finished?: boolean;
}

export type EquipmentStatus = "ongoing" | "returned";

export interface RespiratoryEquipmentEntry {
  id: string;
  name: string;
  status: EquipmentStatus;
}

export interface RespiratoryPatientRecord {
  id: string;
  /** Which folder this patient sits in, when the app has folders enabled. Undefined = no folder. */
  folder?: string;
  patientName: string;
  city?: string;
  equipment: RespiratoryEquipmentEntry[];
  dueDate?: string;
  logDate?: string;
}

export type OrderType = "Delivery" | "Pickup" | "Swapout" | "Sale" | "Service";
export type InvoiceStatus = "printed" | "to_be_printed";

export interface InvoiceRecord {
  id: string;
  /** Which folder this invoice sits in, when the app has folders enabled. Undefined = no folder. */
  folder?: string;
  patientName: string;
  address?: string;
  hospice?: string;
  orderType: OrderType;
  notes?: string;
  status: InvoiceStatus;
  date: string;
}

export type PurchaseOrderStatus = "unpaid" | "paid";

export interface PurchaseOrderRecord {
  id: string;
  /** Which folder this invoice sits in, when the app has folders enabled. Undefined = no folder. */
  folder?: string;
  name: string;
  url?: string;
  isFile?: boolean;
  fileName?: string;
  status: PurchaseOrderStatus;
}

export type TripType = "pre_trip" | "post_trip";

export interface VehicleInspectionRecord {
  id: string;
  driverName: string;
  date: string;
  tripType: TripType;
  location?: string;
  licensePlate?: string;
  vehicle?: string;
  odometer?: number;
  defectiveItems: string[];
  remarks?: string;
  conditionAcceptable: boolean;
  certified: boolean;
}

export interface ChecklistItemEntry {
  name: string;
  quantity: number;
}

export interface EquipmentChecklistRecord {
  id: string;
  employeeName: string;
  date: string;
  confirmedItems: ChecklistItemEntry[];
  certified: boolean;
}

export interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  authorName?: string;
  isActive: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
  lastSignInAt?: string;
}

export interface ClockRecord {
  id: string;
  name: string;
  clockedIn: boolean;
  since?: string;
}

export interface BreakEntry {
  id: string;
  start: string;
  end?: string;
}

export interface TimeEditRequest {
  clockIn?: string;
  clockOut?: string;
  note?: string;
  requestedAt: string;
}

export interface TimeEntry {
  id: string;
  name: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breaks: BreakEntry[];
  editRequest?: TimeEditRequest;
}

interface AppBase {
  id: string;
  name: string;
  initial: string;
  category?: string;
  description?: string;
  icon?: IconName;
  tint?: Tint;
  builtin?: BuiltinKind;
  /** Admin-editable status tabs for builtin apps that filter by status (leads, tasks). */
  statusOptions?: string[];
  /** Whether staff can see this app. Admins always see every app regardless. Defaults to true. */
  visible?: boolean;
  /** Whether this app shows in the sidebar nav list. Undefined = default (list apps yes, link apps no). */
  showInNav?: boolean;
  /** Whether staff (non-admin) can add/edit/delete this app's content. Admins always can. Defaults to false. */
  staffCanManage?: boolean;
  contacts?: ContactRecord[];
  leads?: LeadRecord[];
  announcements?: AnnouncementRecord[];
  tasks?: TaskRecord[];
  clockRecords?: ClockRecord[];
  timeEntries?: TimeEntry[];
  receivablesPayables?: ReceivablePayableRecord[];
  blogPosts?: BlogPostRecord[];
  accounts?: AccountRecord[];
  routeStops?: RouteStopRecord[];
  respiratoryPatients?: RespiratoryPatientRecord[];
  invoices?: InvoiceRecord[];
  purchaseOrders?: PurchaseOrderRecord[];
  vehicleInspections?: VehicleInspectionRecord[];
  equipmentChecklists?: EquipmentChecklistRecord[];
}

export interface LinkApp extends AppBase {
  type: "link";
  url: string;
  subtitle?: string;
  useBrandLogo?: boolean;
  logoDomain?: string;
  isFile?: boolean;
  fileName?: string;
}

export interface ListApp extends AppBase {
  type: "list";
  items: ListItem[];
  unitLabel?: string;
}

export type AppTile = LinkApp | ListApp;
