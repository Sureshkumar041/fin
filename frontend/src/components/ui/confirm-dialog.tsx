'use client';

import type { ReactNode } from 'react';
import { Alert } from './alert';
import { Button } from './button';
import { Dialog } from './dialog';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  /** Shown inside the dialog if the action failed, e.g. an API error. */
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "Are you sure?" for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Delete',
  error,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} dismissible={!loading}>
      <div className="flex flex-col gap-4">
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
