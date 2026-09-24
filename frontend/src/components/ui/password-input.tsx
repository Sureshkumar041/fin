'use client';

import { useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { Input } from './input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

/**
 * Input for passwords with a show/hide button inside it. A mouse click on the
 * button keeps focus and the cursor in the input; keyboard users reach the
 * button with Tab.
 */
export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggle() {
    const input = inputRef.current;
    // Changing `type` can reset the selection; put the cursor back where it was.
    const selection =
      input && document.activeElement === input ? ([input.selectionStart, input.selectionEnd] as const) : null;
    setVisible((v) => !v);
    if (input && selection) {
      requestAnimationFrame(() => input.setSelectionRange(selection[0], selection[1]));
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        // Room for the button, and hide Edge's built-in reveal icon so there is only one.
        className={cn('pr-10 [&::-ms-reveal]:hidden', className)}
        {...props}
      />
      <button
        type="button"
        onClick={toggle}
        // Don't pull focus out of the input on a mouse click.
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}
