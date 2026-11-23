'use client';

export function HauntOverlay({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`haunt-overlay pointer-events-none fixed inset-0 z-40 transition-opacity duration-300 ${
        active ? 'haunt-active opacity-100' : 'opacity-0'
      }`}
    />
  );
}
