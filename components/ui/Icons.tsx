import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SoundOnIcon = (p: IconProps) => (
  <Icon {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </Icon>
);
export const SoundOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);
export const BellOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.9 17.9 0 0 1 18 8" />
    <path d="M6.26 6.26A5.9 5.9 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Icon>
);
export const MotionIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="9" y1="9" x2="9" y2="15" />
    <line x1="15" y1="9" x2="15" y2="15" />
  </Icon>
);
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const MicIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon strokeWidth={3.5} {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

/** Minimal hand-inked ghost mark for the top bar. */
export function GhostMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 3C8.5 3 5 7.2 5 12.8V23.5C5 24.3 5.9 24.7 6.5 24.2L9.2 21.8L11.6 24C12.2 24.5 13 24.5 13.6 24L15.4 22.3L17.6 24.1C18.2 24.6 19.1 24.5 19.6 23.9L21.5 21.8L22.3 22.6C22.8 23 23.5 22.7 23.5 22V12.8C23.5 7.2 19.5 3 14 3Z"
        fill="#EDE6D6"
        stroke="#121110"
        strokeWidth="1.5"
      />
      <circle cx="11.2" cy="12.4" r="1.4" fill="#121110" />
      <circle cx="16.8" cy="12.4" r="1.4" fill="#121110" />
    </svg>
  );
}
