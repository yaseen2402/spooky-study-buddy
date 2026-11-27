'use client';

import { JumpscareArt } from '@/components/ghost/GhostArt';

export function JumpscareFlash({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  if (!active || reducedMotion) return null;
  return (
    <div aria-hidden className="jumpscare-overlay">
      <div className="jumpscare-inner">
        <JumpscareArt />
        <div className="jumpscare-word">BOO!</div>
      </div>
    </div>
  );
}
