'use client';

import type { GhostState } from '@/lib/types';

const LABELS: Record<GhostState, string> = {
  idle: 'Ghost companion, floating idly and waiting for you to start',
  calm: 'Ghost companion, calmly studying alongside you',
  tense: 'Ghost companion, nervously watching — the clock is running out!',
  haunting: 'Ghost companion, glaring with red eyes because you are slacking',
  jumpscare: 'Ghost companion, lunging at you — boo!',
  celebratory: 'Ghost companion, bouncing happily because you finished',
};

export function GhostCompanion({ state, reducedMotion }: { state: GhostState; reducedMotion: boolean }) {
  const shown: GhostState = reducedMotion && state === 'jumpscare' ? 'haunting' : state;
  const angry = shown === 'haunting' || shown === 'jumpscare';
  const tense = shown === 'tense';
  const happy = shown === 'celebratory';
  // Tense state: amber/pumpkin tones; angry: red; happy: green; default: green
  const bodyAccent = angry ? '#ffd6d6' : tense ? '#ffe8c0' : '#e7fff0';
  const bodyEdge = angry ? '#ff9b9b' : tense ? '#ffa94d' : '#b9f5c8';
  const strokeColor = angry ? '#e5383b' : tense ? '#ff8c1a' : '#5fdc83';

  return (
    <div role="img" aria-label={LABELS[shown]} className={`ghost ghost-${shown} relative h-48 w-40 sm:h-56 sm:w-48`}>
      <svg viewBox="0 0 160 190" className="h-full w-full drop-shadow-[0_0_24px_rgba(142,240,167,0.35)]" aria-hidden>
        <defs>
          <radialGradient id="ghost-body" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor={bodyAccent} />
            <stop offset="100%" stopColor={bodyEdge} />
          </radialGradient>
        </defs>

        <path
          className="ghost-body"
          d="M80 8c-38 0-66 30-66 70v92c0 6 6 9 11 5l12-10 12 12c4 4 9 4 13 0l12-12 6 6 6-6 12 12c4 4 9 4 13 0l12-12 12 10c5 4 11 1 11-5V78C146 38 118 8 80 8z"
          fill="url(#ghost-body)"
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Eyes */}
        {happy ? (
          <g stroke="#13111c" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M48 76q10-12 20 0" />
            <path d="M92 76q10-12 20 0" />
          </g>
        ) : tense ? (
          /* Tense: wide open worried eyes with raised inner brows */
          <g>
            <ellipse cx="58" cy="76" rx="11" ry="15" fill="#13111c" />
            <ellipse cx="102" cy="76" rx="11" ry="15" fill="#13111c" />
            <circle cx="62" cy="71" r="4" fill="#fff" />
            <circle cx="106" cy="71" r="4" fill="#fff" />
            {/* Worried brows — raised at inner corners */}
            <path d="M44 58q8-5 16 2M100 58q8 7 16 2" stroke="#13111c" strokeWidth="4.5" strokeLinecap="round" fill="none" />
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
        {/* Tense: wavy uncertain mouth */}
        {tense && (
          <path
            d="M62 112q6-6 12 0t12 0"
            stroke="#13111c"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        )}
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

        {/* Book while studying (calm or tense — still at work) */}
        {(shown === 'calm' || tense) && (
          <g transform="translate(46 128)">
            <path d="M0 6l34-6v34L0 40z" fill={tense ? '#e5383b' : '#ff8c1a'} />
            <path d="M68 6L34 0v34l34 6z" fill={tense ? '#ff6b6b' : '#ffa94d'} />
            <path d="M34 0v34" stroke="#13111c" strokeWidth="2" />
          </g>
        )}

        {/* Sweat drop when tense */}
        {tense && (
          <g>
            <path d="M128 56 q2-6 4 0 q2 5-2 5 q-4 0-2-5z" fill="#7bd4f5" opacity="0.85" />
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
