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
  | "menu";

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
}

export type BuiltinKind = "contacts" | "leads" | "announcements" | "tasks" | "timeclock" | "users";

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
  contacts?: ContactRecord[];
  leads?: LeadRecord[];
  announcements?: AnnouncementRecord[];
  tasks?: TaskRecord[];
  clockRecords?: ClockRecord[];
  timeEntries?: TimeEntry[];
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
