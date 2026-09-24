'use client';

import { useAuth } from '@/components/auth';
import { ChevronDownIcon, LogOutIcon } from '@/components/icons';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Avatar + name in the header; opens a menu with account details and Log out. */
export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Dropdown
      label="Account menu"
      triggerClassName="h-10 gap-2 px-1.5 sm:pr-2.5"
      trigger={
        <>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {initials(user.name)}
          </span>
          <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{user.name}</span>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground sm:inline" />
        </>
      }
    >
      <DropdownLabel>
        <p className="truncate font-medium text-foreground">{user.name}</p>
        <p className="truncate text-muted-foreground">{user.email}</p>
      </DropdownLabel>
      <DropdownSeparator />
      {/* RequireAuth redirects to /login once logged out. */}
      <DropdownItem icon={<LogOutIcon />} onSelect={() => void logout()}>
        Log out
      </DropdownItem>
    </Dropdown>
  );
}
