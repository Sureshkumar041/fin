'use client';

import { MonitorIcon, MoonIcon, SunIcon } from '@/components/icons';
import { Dropdown, DropdownItem } from '@/components/ui';
import { useTheme, type ThemePreference } from './theme-provider';

const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
];

/** Icon button that opens Light / Dark / System. The icon shows what's currently displayed. */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <Dropdown
      label="Theme"
      size="icon"
      trigger={resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
    >
      {options.map((o) => (
        <DropdownItem key={o.value} icon={o.icon} checked={theme === o.value} onSelect={() => setTheme(o.value)}>
          {o.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
