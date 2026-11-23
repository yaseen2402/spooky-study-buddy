'use client';

import type { GhostState } from '@/lib/types';

const LABELS: Record<GhostState, string> = {
  idle: 'Ghost companion, floating idly and waiting for you to start',
  calm: 'Ghost companion, calmly studying alongside you',
  haunting: 'Ghost companion, glaring with red eyes because you are slacking',
  jumpscare: 'Ghost companion, lunging at you — boo!',
  celebratory: 'Ghost companion, bouncing happily because you finished',
};

export function GhostCompanion({ state, reducedMotion }: { state: GhostState; reducedMotion: boolean }) {
  const shown: GhostState = reducedMotion && state === 'jumpscare' ? 'haunting' : state;
  const angry = shown === 'haunting' || shown === 'jumpscare';
  const happy = shown === 'celebratory';

  return (
    <div role="img" aria-label={LABELS[shown]} className={`ghost ghost-${shown} relative h-48 w-40 sm:h-56 sm:w-48`}>
      <svg viewBox="0 0 160 190" className="h-full w-full drop-shadow-[0_0_24px_rgba(142,240,167,0.35)]" aria-hidden>
        <defs>
          <radialGradient id="ghost-body" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor={angry ? '#ffd6d6' : '#e7fff0'} />
            <stop offset="100%" stopColor={angry ? '#ff9b9b' : '#b9f5c8'} />
          </radialGradient>
        </defs>

        <path
          className="ghost-body"
          d="M80 8c-38 0-66 30-66 70v92c0 6 6 9 11 5l12-10 12 12c4 4 9 4 13 0l12-12 6 6 6-6 12 12c4 4 9 4 13 0l12-12 12 10c5 4 11 1 11-5V78C146 38 118 8 80 8z"
          fill="url(#ghost-body)"
          stroke={angry ? '#e5383b' : '#5fdc83'}
          strokeWidth="2"
        />

        {/* Eyes */}
        {happy ? (
          <g stroke="#13111c" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M48 76q10-12 20 0" />
            <path d="M92 76q10-12 20 0" />
          </g>
        ) : (
          <g>
            <ellipse cx="58" cy="76" rx="11" ry={angry ? 9 : 14} fill={angry ? '#a4161a' : '#13111c'} />
            <ellipse cx="102" cy="76" rx="11" ry={angry ? 9 : 14} fill={angry ? '#a4161a' : '#13111c'} />
            {angry ? (
              <>
                <circle className="ghost-eye-glow" cx="58" cy="76" r="4" fill="#ff6b6b" />
                <circle className="ghost-eye-glow" cx="102" cy="76" r="4" fill="#ff6b6b" />
                <path d="M42 58l28 10M118 58l-28 10" stroke="#13111c" strokeWidth="5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="62" cy="71" r="4" fill="#fff" />
                <circle cx="106" cy="71" r="4" fill="#fff" />
              </>
            )}
          </g>
        )}

        {/* Mouth */}
        {shown === 'idle' && <ellipse cx="80" cy="110" rx="7" ry="9" fill="#13111c" />}
        {shown === 'calm' && <path d="M68 108q12 9 24 0" stroke="#13111c" strokeWidth="5" fill="none" strokeLinecap="round" />}
        {happy && <path d="M60 102q20 26 40 0z" fill="#13111c" />}
        {angry && (
          <path
            d="M56 116l8-10 8 10 8-10 8 10 8-10 8 10"
            stroke="#13111c"
            strokeWidth="5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Book while studying */}
        {shown === 'calm' && (
          <g transform="translate(46 128)">
            <path d="M0 6l34-6v34L0 40z" fill="#ff8c1a" />
            <path d="M68 6L34 0v34l34 6z" fill="#ffa94d" />
            <path d="M34 0v34" stroke="#13111c" strokeWidth="2" />
          </g>
        )}

        {/* Blush when celebrating */}
        {happy && (
          <g fill="#ff8fa3" opacity="0.6">
            <ellipse cx="40" cy="96" rx="9" ry="5" />
            <ellipse cx="120" cy="96" rx="9" ry="5" />
          </g>
        )}
      </svg>
    </div>
  );
}
