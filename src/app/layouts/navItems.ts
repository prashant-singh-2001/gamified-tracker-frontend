import {
  Bell,
  ChartColumn,
  History,
  House,
  Mountain,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

/** Tab-bar destinations on either side of the raised Log button. */
export const TAB_LEFT: NavItem[] = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/ranks', label: 'Ranks', icon: Mountain },
];

export const TAB_RIGHT: NavItem[] = [{ to: '/app/stats', label: 'Stats', icon: ChartColumn }];

/** Reached from "More" on phones; listed directly in the desktop rail. */
export const MORE_ITEMS: NavItem[] = [
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/coach', label: 'Weekly coach', icon: Sparkles },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
];

export const RAIL_ITEMS: NavItem[] = [...TAB_LEFT, ...TAB_RIGHT, ...MORE_ITEMS];
