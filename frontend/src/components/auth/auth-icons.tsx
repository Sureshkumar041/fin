import type { ReactNode, SVGProps } from 'react';

// Icons used only by the auth forms (same style as components/icons: 24px grid,
// 2px strokes, currentColor), plus a wrapper that puts one inside an input.
type IconProps = SVGProps<SVGSVGElement>;

const Icon = ({ children, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-4.5"
    {...props}
  >
    {children}
  </svg>
);

export const MailIcon = () => (
  <Icon>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);
export const LockIcon = () => (
  <Icon>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Icon>
);
export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

/**
 * A decorative leading icon inside an input. Give the input `pl-10!` so the
 * text starts after the icon; the label stays the input's accessible name.
 */
export function IconField({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}
