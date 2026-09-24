'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { buttonClassName, type Size, type Variant } from './button';

const DropdownContext = createContext<{ close: () => void } | null>(null);

type DropdownProps = {
  /** Content of the trigger button (text and/or icon). */
  trigger: ReactNode;
  /** Accessible name for the trigger, required when it only shows an icon. */
  label?: string;
  variant?: Variant;
  size?: Size;
  /** Which edge of the trigger the menu lines up with. */
  align?: 'start' | 'end';
  triggerClassName?: string;
  children: ReactNode;
};

/**
 * Menu button following the WAI-ARIA menu pattern: Enter/Space/ArrowDown
 * open it, arrow keys move between items, Escape closes and returns focus,
 * clicking outside closes.
 *
 *   <Dropdown trigger="Options">
 *     <DropdownItem onSelect={...}>Rename</DropdownItem>
 *   </Dropdown>
 */
export function Dropdown({
  trigger,
  label,
  variant = 'ghost',
  size = 'md',
  align = 'end',
  triggerClassName,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
  const focusItem = (index: number) => {
    const list = items();
    list[(index + list.length) % list.length]?.focus();
  };

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Focus the first item when the menu opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
  }, [open]);

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(index + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(index - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(list.length - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close(false);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={buttonClassName(variant, size, triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <DropdownContext.Provider value={{ close: () => close() }}>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            className={cn(
              'absolute z-50 mt-2 min-w-48 rounded-xl border border-border bg-card p-1 text-card-foreground shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {children}
          </div>
        </DropdownContext.Provider>
      )}
    </div>
  );
}

type DropdownItemProps = {
  onSelect: () => void;
  icon?: ReactNode;
  /** Makes it a radio-style item (e.g. theme choice) with a check mark. */
  checked?: boolean;
  variant?: 'default' | 'danger';
  children: ReactNode;
};

export function DropdownItem({ onSelect, icon, checked, variant = 'default', children }: DropdownItemProps) {
  const ctx = useContext(DropdownContext);
  const isRadio = checked !== undefined;
  return (
    <button
      type="button"
      role={isRadio ? 'menuitemradio' : 'menuitem'}
      aria-checked={isRadio ? checked : undefined}
      tabIndex={-1}
      onClick={() => {
        onSelect();
        ctx?.close();
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none',
        'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
        variant === 'danger' ? 'text-danger' : 'text-foreground',
      )}
    >
      {icon && <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>}
      <span className="flex-1">{children}</span>
      {checked && <CheckIcon className="size-4 text-primary" />}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}

/** Non-interactive heading inside a menu, e.g. the signed-in user's name. */
export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 py-2 text-sm">{children}</div>;
}
