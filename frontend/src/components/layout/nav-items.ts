import { DashboardIcon, ReceiptIcon, TagIcon } from '@/components/icons';

// The app's main sections. Add a line here to add a page to the sidebar.
export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/expenses', label: 'Expenses', icon: ReceiptIcon },
  { href: '/categories', label: 'Categories', icon: TagIcon },
];

export const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
