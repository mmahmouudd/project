import type { ReactNode } from "react";

export type IconName =
  | "dashboard"
  | "users"
  | "flag"
  | "compass"
  | "book"
  | "scroll"
  | "logout"
  | "plus"
  | "search"
  | "x"
  | "pencil"
  | "trash"
  | "calendar"
  | "star"
  | "award"
  | "check"
  | "menu"
  | "leaf"
  | "heart"
  | "sun"
  | "sparkle"
  | "chat"
  | "chart"
  | "clock"
  | "arrowRight"
  | "shield"
  | "refresh";

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.8" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 19.2c.9-3.3 3.4-5.1 6.2-5.1s5.3 1.8 6.2 5.1" />
      <circle cx="17.2" cy="9.2" r="2.5" />
      <path d="M17.6 14.4c2.2.4 3.4 1.9 3.8 4" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11.2l-2.7 3.6 2.7 3.6H5.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 19.2V6.8A2.8 2.8 0 0 1 7.3 4h12.2v11.4H7.3a2.8 2.8 0 0 0 0 5.6z" />
      <path d="M4.5 19.2A2.8 2.8 0 0 1 7.3 15.4h12.2" />
    </>
  ),
  scroll: (
    <>
      <path d="M8.5 6h12" />
      <path d="M8.5 12h12" />
      <path d="M8.5 18h8" />
      <path d="M3.5 6h.01" />
      <path d="M3.5 12h.01" />
      <path d="M3.5 18h.01" />
    </>
  ),
  logout: (
    <>
      <path d="M14.5 4h4.7A1.8 1.8 0 0 1 21 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-4.7" />
      <path d="M3.5 12h11" />
      <path d="M10 8l4 4-4 4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l1.1-4.1L16.6 4.4a2.1 2.1 0 0 1 3 3L8.1 18.9z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M6.2 7l.9 13h9.8l.9-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10.5h16" />
      <path d="M8.5 3.5v4" />
      <path d="M15.5 3.5v4" />
    </>
  ),
  star: (
    <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.2" />
      <path d="M8.8 13.2L7.3 20.5l4.7-2.4 4.7 2.4-1.5-7.3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 21c0-9.5 5.5-15 14.5-16.5C19.5 14 14 19.5 5 21z" />
      <path d="M5 21c2.5-6.5 6.5-11.5 11.5-14.5" />
    </>
  ),
  heart: (
    <path d="M12 20.5C8.2 17.3 3.5 13.8 3.5 9.6 3.5 6.6 5.8 4.8 8.3 4.8c1.7 0 3 .9 3.7 2.1.7-1.2 2-2.1 3.7-2.1 2.5 0 4.8 1.8 4.8 4.8 0 4.2-4.7 7.7-8.5 10.9z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v2" />
      <path d="M12 18.5v2" />
      <path d="M3.5 12h2" />
      <path d="M18.5 12h2" />
      <path d="M6 6l1.4 1.4" />
      <path d="M16.6 16.6L18 18" />
      <path d="M18 6l-1.4 1.4" />
      <path d="M7.4 16.6L6 18" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 4.5l1.7 4.9 4.9 1.7-4.9 1.7-1.7 4.9-1.7-4.9L5.4 11l4.9-1.7z" />
      <path d="M18.8 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  chat: (
    <>
      <path d="M20.5 11.8a2 2 0 0 1-2 2H8.9L3.5 18V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      <path d="M8 9.5h.01" />
      <path d="M12 9.5h.01" />
      <path d="M16 9.5h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V9" />
      <path d="M17 20V5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h15" />
      <path d="M13.5 6l6 6-6 6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.8v5.2c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6.3z" />
      <path d="M9 12l2.2 2.2L15.5 9.7" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 3.5V8h-4.5" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.sparkle}
    </svg>
  );
}
