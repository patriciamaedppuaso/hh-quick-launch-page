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
  | "grip";

export interface Tint {
  bg: string;
  fg: string;
}

export interface ListItem {
  id: string;
  name: string;
  url: string;
}

interface AppBase {
  id: string;
  name: string;
  initial: string;
  category?: string;
  description?: string;
  icon?: IconName;
  tint?: Tint;
}

export interface LinkApp extends AppBase {
  type: "link";
  url: string;
  subtitle?: string;
  useBrandLogo?: boolean;
  logoDomain?: string;
}

export interface ListApp extends AppBase {
  type: "list";
  items: ListItem[];
  unitLabel?: string;
}

export type AppTile = LinkApp | ListApp;
