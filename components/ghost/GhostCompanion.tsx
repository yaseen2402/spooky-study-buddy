'use client';

import type { GhostState } from '@/lib/types';
import { GhostArt, type GhostMood } from './GhostArt';

const LABELS: Record<GhostState, string> = {
  idle: 'Ghost companion, floating idly and waiting for you to start',
  calm: 'Ghost companion, calmly studying alongside you',
  tense: 'Ghost companion, nervously watching — the clock is running out!',
  haunting: 'Ghost companion, glaring with red eyes because you are slacking',
  jumpscare: 'Ghost companion, lunging at you — boo!',
  celebratory: 'Ghost companion, bouncing happily because you finished',
};

const MOOD: Record<GhostState, GhostMood> = {
  idle: 'idle',
  calm: 'studying',
  tense: 'final',
  haunting: 'haunted',
  jumpscare: 'haunted', // the full-screen BOO! is drawn by JumpscareFlash
  celebratory: 'celebrating',
};

export function GhostCompanion({
  state,
  reducedMotion,
  className = 'ghost-stage',
}: {
  state: GhostState;
  reducedMotion: boolean;
  className?: string;
}) {
  const shown: GhostState = reducedMotion && state === 'jumpscare' ? 'haunting' : state;
  return (
    <div role="img" aria-label={LABELS[shown]} className={className}>
      <GhostArt mood={MOOD[shown]} />
    </div>
  );
}
