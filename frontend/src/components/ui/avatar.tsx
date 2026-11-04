import { accentFor, ACCENT_CLASSES, type Accent } from '@/lib/category-color';
import { cn } from '@/lib/cn';

const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-11 text-sm' } as const;

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => [...part][0]!.toUpperCase())
    .join('');
}

type AvatarProps = {
  name: string;
  /** Stable key for the colour (an id), so renaming doesn't change it. */
  colorKey: string;
  /** One letter instead of two, e.g. for categories. */
  single?: boolean;
  accent?: Accent;
  size?: keyof typeof sizes;
  className?: string;
};

/**
 * Initials on a gradient circle in a stable accent colour. Decorative: the
 * name is always written next to it, so it's hidden from screen readers.
 * Dark text on the bright gradients is >= 6.2:1 in both themes.
 */
export function Avatar({ name, colorKey, single, accent, size = 'md', className }: AvatarProps) {
  const a = accent ?? accentFor(colorKey);
  const text = single ? ([...name.trim()][0] ?? '?').toUpperCase() : initials(name) || '?';
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-on-brand select-none',
        ACCENT_CLASSES[a].gradient,
        sizes[size],
        className,
      )}
    >
      {text}
    </span>
  );
}
