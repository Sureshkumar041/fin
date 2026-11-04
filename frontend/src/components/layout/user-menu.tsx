'use client';

import { useAuth } from '@/components/auth';
import { ChevronDownIcon, LogOutIcon } from '@/components/icons';
import { Avatar, Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui';

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
          <Avatar name={user.name} colorKey={user.id} size="sm" className="size-8" />
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
