'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Set to false while saving so Escape or a backdrop click can't close it mid-request. */
  dismissible?: boolean;
  /** 'drawer' slides in from the left (mobile navigation); default is a centered modal. */
  placement?: 'center' | 'left';
  /** Hide the visible title (it stays available to screen readers). */
  hideTitle?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Modal built on the native <dialog> element, which gives focus trapping,
 * Escape to close and a backdrop for free. Children are only mounted while
 * open, so forms inside start fresh every time.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  dismissible = true,
  placement = 'center',
  hideTitle = false,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // Escape: let React state decide
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        // A click on the <dialog> itself (not its content) is a backdrop click.
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
      className={cn(
        'border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-overlay',
        placement === 'center'
          ? 'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl'
          : 'my-0 mr-auto ml-0 h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none border-y-0 border-l-0',
        className,
      )}
    >
      {open && (
        <div className={placement === 'center' ? 'p-6' : 'flex h-full flex-col'}>
          <div className={cn('flex items-start justify-between gap-4', hideTitle && 'sr-only')}>
            <div>
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {placement === 'left' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-3 right-3 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CloseIcon />
            </button>
          )}
          <div className={placement === 'center' ? 'mt-5' : 'flex-1 overflow-y-auto'}>{children}</div>
        </div>
      )}
    </dialog>
  );
}
