'use client';

/** Vermilion ink wash + faint scanlines over the whole page while haunted. */
export function HauntOverlay({ active }: { active: boolean }) {
  return (
    <>
      <div aria-hidden className={`haunt-wash ${active ? 'active' : ''}`} />
      <div aria-hidden className={`haunt-scanlines ${active ? 'active' : ''}`} />
    </>
  );
}
