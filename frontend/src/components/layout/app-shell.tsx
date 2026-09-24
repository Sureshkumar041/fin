'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { MenuIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/theme';
import { Button, Dialog } from '@/components/ui';
import { Brand } from './brand';
import { SidebarNav } from './sidebar-nav';
import { UserMenu } from './user-menu';

/**
 * Logged-in layout:
 *  - desktop (lg+): fixed sidebar on the left, header on top of the content
 *  - tablet/mobile: header with a menu button that opens the nav as a drawer
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav />
        </div>
      </aside>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" placement="left" hideTitle>
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="px-3 py-4">
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </div>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </Button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
