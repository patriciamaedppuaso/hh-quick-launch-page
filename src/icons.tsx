import type { ReactNode } from "react";
import type { IconName } from "./types";

interface Props {
  name: IconName;
  className?: string;
}

const PATHS: Record<IconName, ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </>
  ),
  message: (
    <path d="M21 12a7.5 7.5 0 0 1-7.5 7.5H8l-4.5 3 1-4.7A7.5 7.5 0 1 1 21 12Z" />
  ),
  dollar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M14.8 9c0-1.1-1.3-2-2.8-2s-2.8.9-2.8 2 1.3 1.7 2.8 2 2.8.9 2.8 2-1.3 2-2.8 2-2.8-.9-2.8-2" />
    </>
  ),
  cloud: <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7.1 9.02 4 4 0 0 0 7 18Z" />,
  file: (
    <>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h6" />
    </>
  ),
  phone: (
    <path d="M6.6 4h3l1.4 4.4-2.2 1.7a12 12 0 0 0 5.1 5.1l1.7-2.2 4.4 1.4v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 6.2 2 2 0 0 1 6.6 4Z" />
  ),
  "check-square": (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 12.5l2.5 2.5 5.5-5.5" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H6l3.5 4V5L6 9H4.5A1.5 1.5 0 0 0 3 10.5Z" />
      <path d="M13 8a5 5 0 0 1 0 8M17 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 6" />
      <path d="M15 13a6 6 0 0 1 6 6" />
    </>
  ),
  "user-plus": (
    <>
      <circle cx="10" cy="8.5" r="3.5" />
      <path d="M3.5 19a6.5 6.5 0 0 1 13 0" />
      <path d="M18.5 8v5M16 10.5h5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8 20.5h8M12 16.5v4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s7-6.1 7-11.5a7 7 0 1 0-14 0c0 5.4 7 11.5 7 11.5Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  list: (
    <>
      <rect x="4" y="5" width="4" height="4" rx="1" />
      <rect x="4" y="10" width="4" height="4" rx="1" />
      <rect x="4" y="15" width="4" height="4" rx="1" />
      <path d="M11 7h9M11 12h9M11 17h9" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  "arrow-left": <path d="M15 18l-6-6 6-6" />,
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.5H19.5A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({ name, className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
