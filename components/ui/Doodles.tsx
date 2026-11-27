/**
 * Faint hand-drawn doodles (spiderwebs, moon, bats, stars) behind the stage.
 * Drawn in currentColor so they pick up the state accent from CSS.
 */
const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BAT =
  'M30 14c-3-6-9-9-16-6 3 2 3 5 1 7-4-2-9-1-13 3 6 0 10 1 13 4 3-3 9-4 15-2 6-2 12-1 15 2 3-3 7-4 13-4-4-4-9-5-13-3-2-2-2-5 1-7-7-3-13 0-16 6z';
const WEB =
  'M0 0l120 60M0 0l90 90M0 0l60 120M0 30q14 4 22-8M0 60q30 6 44-16M0 92q46 6 66-26M30 0q-2 16 10 22M60 0q0 30 22 44';
const STAR = 'M10 2v16M2 10h16M4.5 4.5l11 11M15.5 4.5l-11 11';

export function Doodles() {
  return (
    <div aria-hidden className="doodles">
      {/* spiderweb, top-left corner */}
      <svg viewBox="0 0 120 120" className="doodle" style={{ left: 0, top: 0, width: 150 }}>
        <path d={WEB} {...line} strokeWidth={1.4} />
      </svg>
      {/* spiderweb, bottom-right corner (mirrored) */}
      <svg viewBox="0 0 120 120" className="doodle" style={{ right: 0, bottom: 0, width: 120, transform: 'rotate(180deg)' }}>
        <path d={WEB} {...line} strokeWidth={1.4} />
        {/* dangling spider */}
        <path d="M84 44v22" {...line} strokeWidth={1.2} />
        <circle cx="84" cy="70" r="4" fill="currentColor" />
        <path d="M80 68l-5-3M80 72l-5 3M88 68l5-3M88 72l5 3" {...line} strokeWidth={1.2} />
      </svg>
      {/* moon */}
      <svg viewBox="0 0 80 80" className="doodle" style={{ right: '7%', top: '12%', width: 72, transform: 'rotate(-12deg)' }}>
        <path d="M52 10a30 30 0 1 0 18 44A26 26 0 0 1 52 10z" {...line} />
        <path d="M36 34l2 2M30 48l3 1" {...line} />
      </svg>
      {/* bats */}
      <svg viewBox="0 0 60 30" className="doodle doodle-bat" style={{ left: '8%', top: '30%', width: 58 }}>
        <path d={BAT} {...line} />
      </svg>
      <svg
        viewBox="0 0 60 30"
        className="doodle doodle-bat"
        style={{ right: '14%', top: '52%', width: 38, animationDelay: '-3s' }}
      >
        <path d={BAT} {...line} />
      </svg>
      {/* stars */}
      <svg viewBox="0 0 20 20" className="doodle" style={{ left: '22%', top: '16%', width: 16 }}>
        <path d={STAR} {...line} strokeWidth={1.6} />
      </svg>
      <svg viewBox="0 0 20 20" className="doodle" style={{ left: '10%', bottom: '22%', width: 13 }}>
        <path d="M10 2v16M2 10h16" {...line} />
      </svg>
      <svg viewBox="0 0 20 20" className="doodle" style={{ right: '24%', top: '28%', width: 11 }}>
        <path d="M10 2v16M2 10h16" {...line} />
      </svg>
    </div>
  );
}
