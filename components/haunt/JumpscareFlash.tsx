'use client';

export function JumpscareFlash({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  if (!active || reducedMotion) return null;
  return (
    <div aria-hidden className="jumpscare-flash pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <span className="jumpscare-text font-display text-7xl text-bone sm:text-9xl">BOO!</span>
    </div>
  );
}
