export type Role = "admin" | "employee";

export interface ListItem {
  id: string;
  name: string;
  url: string;
}

export interface LinkApp {
  id: string;
  type: "link";
  name: string;
  url: string;
  initial: string;
}

export interface ListApp {
  id: string;
  type: "list";
  name: string;
  items: ListItem[];
  initial: string;
}

export type AppTile = LinkApp | ListApp;
