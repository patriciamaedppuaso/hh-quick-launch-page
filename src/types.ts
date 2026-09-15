export type Role = "admin" | "employee";

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

export type BuiltinKind = "contacts" | "leads" | "announcements" | "tasks" | "timeclock";

export interface ContactRecord {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface LeadRecord {
  id: string;
  name: string;
  company?: string;
  status: LeadStatus;
  value?: number;
  followUp?: string;
  notes?: string;
  createdAt?: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  date: string;
  author?: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskRecord {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignee?: string;
  priority?: TaskPriority;
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
