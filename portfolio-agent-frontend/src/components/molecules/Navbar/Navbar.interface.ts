export interface NavItem {
  path: string;
  label: string;
}

export interface NavbarProps {}

export const navItems: NavItem[] = [
  { path: "/", label: "Portfolio" },
  { path: "/processing", label: "Processing" },
  { path: "/decisions", label: "Decisions" },
  { path: "/knowledge", label: "Knowledge" },
  { path: "/chat", label: "Chat" },
  { path: "/signals", label: "Signals" },
  { path: "/positions", label: "Positions" },
];
