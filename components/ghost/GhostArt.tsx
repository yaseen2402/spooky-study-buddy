/**
 * Hand-inked ghost illustrations — one per expression.
 * Bone-white body (#F4EFE6), obsidian ink (#121110). From spooky_study_buddy.html.
 */

export type GhostMood = 'idle' | 'studying' | 'final' | 'haunted' | 'celebrating';

const BONE = '#F4EFE6';
const INK = '#121110';

const ink = { stroke: INK, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Idle() {
  return (
    <svg className="ghost-svg" viewBox="0 0 220 220" fill="none" aria-hidden>
      <ellipse cx="110" cy="198" rx="46" ry="7" fill="#0A0908" opacity="0.65" />
      <g className="ghost-bob">
        <path
          d="M56 105C56 64 78 38 110 38C142 38 164 64 164 105V169C164 175 157 177 153 172L143 161C140 158 135 158 132 161L122 172C118 176 112 176 108 172L99 162C96 159 91 159 88 162L78 173C74 177 67 175 65 170L58 158C56.7 155 56 152 56 148V105Z"
          fill={BONE}
          stroke={INK}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M148 64C155 76 158 91 158 108V163" stroke="#D9D0C1" strokeWidth="5" strokeLinecap="round" />
        {/* half-lidded curious eyes */}
        <ellipse cx="94" cy="96" rx="7" ry="8.5" fill={INK} />
        <ellipse cx="126" cy="96" rx="7" ry="8.5" fill={INK} />
        <path d="M84 91H104" stroke={BONE} strokeWidth="4.5" />
        <path d="M116 91H136" stroke={BONE} strokeWidth="4.5" />
        <path d="M84 93.5L103 92" {...ink} strokeWidth="2.6" />
        <path d="M117 92L136 93.5" {...ink} strokeWidth="2.6" />
        <circle cx="96.5" cy="97.5" r="1.8" fill={BONE} />
        <circle cx="128.5" cy="97.5" r="1.8" fill={BONE} />
        {/* wry smirk */}
        <path d="M103 114C108 118 117 116 121 111" {...ink} strokeWidth="2.6" />
        {/* arms: one relaxed, one on chin */}
        <path d="M62 115C48 118 45 130 56 135C62 138 68 134 70 128" fill={BONE} {...ink} strokeWidth="3" />
        <path d="M156 120C147 132 132 131 124 121C119 115 127 109 133 114" fill={BONE} {...ink} strokeWidth="3" />
      </g>
    </svg>
  );
}

function Studying() {
  return (
    <svg className="ghost-svg" viewBox="0 0 220 220" fill="none" aria-hidden>
      <ellipse cx="110" cy="198" rx="46" ry="7" fill="#0A0908" opacity="0.65" />
      <g className="ghost-bob">
        <path
          d="M56 102C56 61 78 36 110 36C142 36 164 61 164 102V167C164 173 157 175 153 170L143 159C140 156 135 156 132 159L122 170C118 174 112 174 108 170L99 160C96 157 91 157 88 160L78 171C74 175 67 173 65 168L58 156C56.7 153 56 150 56 146V102Z"
          fill={BONE}
          stroke={INK}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M148 62C155 74 158 89 158 106V161" stroke="#D9D0C1" strokeWidth="5" strokeLinecap="round" />
        {/* focused eyes, looking down at the book */}
        <ellipse cx="94" cy="94" rx="5.2" ry="6.2" fill={INK} />
        <ellipse cx="126" cy="94" rx="5.2" ry="6.2" fill={INK} />
        <circle cx="95.5" cy="96.5" r="1.4" fill={BONE} />
        <circle cx="127.5" cy="96.5" r="1.4" fill={BONE} />
        {/* wire-frame glasses */}
        <circle cx="94" cy="93" r="12" stroke="#E5A93C" strokeWidth="2.2" fill="rgba(229,169,60,0.08)" />
        <circle cx="126" cy="93" r="12" stroke="#E5A93C" strokeWidth="2.2" fill="rgba(229,169,60,0.08)" />
        <path d="M106 93H114" stroke="#E5A93C" strokeWidth="2.2" />
        <path d="M82 91L70 88" stroke="#E5A93C" strokeWidth="2" />
        <path d="M138 91L150 88" stroke="#E5A93C" strokeWidth="2" />
        <path d="M106 109H114" {...ink} strokeWidth="2.2" />
        {/* open hardcover book */}
        <path d="M68 124L110 132L152 124V156L110 164L68 156V124Z" fill="#2A2622" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M73 121L110 129L147 121V151L110 159L73 151V121Z" fill="#EDE6D6" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <line x1="110" y1="129" x2="110" y2="159" stroke={INK} strokeWidth="2" />
        <line x1="80" y1="131" x2="102" y2="135" stroke="#8F887D" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="80" y1="138" x2="102" y2="142" stroke="#8F887D" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="118" y1="135" x2="140" y2="131" stroke="#8F887D" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="118" y1="142" x2="136" y2="139" stroke="#8F887D" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M115 157V172L118.5 168.5L122 172V156" fill="#E5A93C" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        {/* hands gripping the book */}
        <path d="M62 128C57 132 59 144 71 142C75 141 77 135 73 131" fill={BONE} {...ink} strokeWidth="2.8" />
        <path d="M158 128C163 132 161 144 149 142C145 141 143 135 147 131" fill={BONE} {...ink} strokeWidth="2.8" />
      </g>
    </svg>
  );
}

function Final() {
  return (
    <svg className="ghost-svg" viewBox="0 0 220 220" fill="none" aria-hidden>
      <ellipse cx="110" cy="198" rx="46" ry="7" fill="#0A0908" opacity="0.65" />
      <g className="ghost-tremble">
        <path
          d="M56 105C56 64 78 38 110 38C142 38 164 64 164 105V169C164 175 157 177 153 172L143 161C140 158 135 158 132 161L122 172C118 176 112 176 108 172L99 162C96 159 91 159 88 162L78 173C74 177 67 175 65 170L58 158C56.7 155 56 152 56 148V105Z"
          fill={BONE}
          stroke={INK}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* worried brows */}
        <path d="M82 82L101 76" {...ink} strokeWidth="2.8" />
        <path d="M138 82L119 76" {...ink} strokeWidth="2.8" />
        {/* wide darting eyes */}
        <circle cx="94" cy="96" r="10" fill="#FFFFFF" stroke={INK} strokeWidth="2.6" />
        <circle cx="126" cy="96" r="10" fill="#FFFFFF" stroke={INK} strokeWidth="2.6" />
        <circle cx="97" cy="96" r="3.4" fill={INK} />
        <circle cx="129" cy="96" r="3.4" fill={INK} />
        <path d="M97 116C101 112 105 119 110 115C115 111 119 118 123 114" {...ink} strokeWidth="2.6" />
        {/* sweat */}
        <path
          className="sweat-drop"
          d="M153 68C153 68 161 78 161 83C161 87.5 157.5 90 153 90C148.5 90 145 87.5 145 83C145 78 153 68 153 68Z"
          fill="#E06D32"
          stroke={INK}
          strokeWidth="2.2"
        />
        <path
          className="sweat-drop"
          style={{ animationDelay: '0.45s' }}
          d="M67 74C67 74 72 81 72 84.5C72 87.5 69.8 89 67 89C64.2 89 62 87.5 62 84.5C62 81 67 74 67 74Z"
          fill="#E06D32"
          stroke={INK}
          strokeWidth="2"
        />
        {/* pocket watch */}
        <circle cx="154" cy="134" r="15" fill="#E06D32" stroke={INK} strokeWidth="2.6" />
        <circle cx="154" cy="134" r="10.5" fill={BONE} stroke={INK} strokeWidth="1.8" />
        <path d="M154 119V114M150 114H158" {...ink} strokeWidth="2.4" />
        <path d="M154 134V127M154 134L160 136" {...ink} strokeWidth="2" />
        <path d="M63 122C71 131 85 136 92 128" fill={BONE} {...ink} strokeWidth="2.8" />
        <path d="M140 128C136 136 142 143 148 139" fill={BONE} {...ink} strokeWidth="2.8" />
      </g>
    </svg>
  );
}

function Haunted() {
  return (
    <svg className="ghost-svg" viewBox="0 0 220 220" fill="none" aria-hidden>
      <ellipse cx="110" cy="198" rx="50" ry="8" fill="#2A0B09" opacity="0.8" />
      <g className="ghost-angry-hover">
        {/* anger marks */}
        <path d="M36 62L48 68L42 78" stroke="#E03C31" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M184 58L172 65L179 75" stroke="#E03C31" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M168 38L162 46L172 48L165 56" stroke="#E03C31" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M54 104C54 62 77 36 110 36C143 36 166 62 166 104V168C166 174 159 176 154 171L144 160C141 157 136 157 133 160L123 171C119 175 113 175 109 171L99 161C96 158 91 158 88 161L77 172C73 176 66 174 64 169L56 157C54.7 154 54 151 54 147V104Z"
          fill={BONE}
          stroke={INK}
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        <path d="M135 55L140 60L135 65M147 55L142 60L147 65" stroke="#E03C31" strokeWidth="2.4" strokeLinecap="round" />
        {/* red eyes */}
        <path d="M81 86L104 94C102 103 86 105 81 95V86Z" fill="#E03C31" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M139 86L116 94C118 103 134 105 139 95V86Z" fill="#E03C31" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="94" cy="95" r="2.2" fill="#FFF4F0" />
        <circle cx="126" cy="95" r="2.2" fill="#FFF4F0" />
        <path d="M77 79L105 90" {...ink} strokeWidth="3.8" />
        <path d="M143 79L115 90" {...ink} strokeWidth="3.8" />
        {/* scolding mouth */}
        <path d="M96 114C102 109 118 109 124 114C126 123 120 130 110 130C100 130 94 123 96 114Z" fill={INK} />
        <path d="M102 125C106 122 114 122 118 125" stroke="#E03C31" strokeWidth="2.4" strokeLinecap="round" />
        {/* hand on hip, finger pointing */}
        <path d="M58 118C44 122 44 136 59 138" fill={BONE} {...ink} strokeWidth="3" />
        <path
          d="M154 118C166 114 184 113 188 120C191 126 177 131 168 131C165 136 156 137 151 133"
          fill={BONE}
          {...ink}
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}

function Celebrating() {
  return (
    <svg className="ghost-svg" viewBox="0 0 220 220" fill="none" aria-hidden>
      <ellipse cx="110" cy="202" rx="44" ry="6.5" fill="#0A0908" opacity="0.6" />
      <g className="ghost-bob">
        {/* sparkles */}
        <path d="M40 72L44 62L48 72L58 76L48 80L44 90L40 80L30 76L40 72Z" fill="#E5A93C" />
        <path d="M174 64L177 56L180 64L188 67L180 70L177 78L174 70L166 67L174 64Z" fill="#8FB38A" />
        <circle cx="170" cy="104" r="3.5" fill="#E5A93C" />
        <circle cx="48" cy="112" r="3" fill="#8FB38A" />
        <path
          d="M58 112C58 73 79 48 110 48C141 48 162 73 162 112V172C162 178 155 180 151 175L142 165C139 162 134 162 131 165L122 175C118 179 112 179 108 175L99 166C96 163 91 163 88 166L78 176C74 180 67 178 65 173L59 162C58.3 159 58 156 58 152V112Z"
          fill={BONE}
          stroke={INK}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* party hat */}
        <path d="M90 54L114 14L134 55Z" fill="#E5A93C" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M100 37L125 39M94 47L130 49" stroke={INK} strokeWidth="2.2" />
        <circle cx="114" cy="12" r="5" fill="#8FB38A" stroke={INK} strokeWidth="2.2" />
        {/* ^ ^ eyes */}
        <path d="M84 102C87 94 97 94 100 102" {...ink} strokeWidth="3.2" />
        <path d="M120 102C123 94 133 94 136 102" {...ink} strokeWidth="3.2" />
        <ellipse cx="80" cy="111" rx="7" ry="4" fill="#E5A93C" opacity="0.55" />
        <ellipse cx="140" cy="111" rx="7" ry="4" fill="#E5A93C" opacity="0.55" />
        <path d="M98 114C103 124 117 124 122 114" {...ink} strokeWidth="2.8" />
        {/* arms up */}
        <path d="M62 118C44 106 41 90 52 86C60 83 66 96 67 104" fill={BONE} {...ink} strokeWidth="3" />
        <path d="M158 118C176 106 179 90 168 86C160 83 154 96 153 104" fill={BONE} {...ink} strokeWidth="3" />
      </g>
    </svg>
  );
}

const ART: Record<GhostMood, () => JSX.Element> = {
  idle: Idle,
  studying: Studying,
  final: Final,
  haunted: Haunted,
  celebrating: Celebrating,
};

export function GhostArt({ mood }: { mood: GhostMood }) {
  const Art = ART[mood];
  return <Art />;
}

/** Giant close-up for the BOO! jumpscare. */
export function JumpscareArt() {
  return (
    <svg className="jumpscare-svg" viewBox="0 0 320 260" fill="none" aria-hidden>
      <path
        d="M22 40L58 64M298 40L262 64M14 130H48M306 130H272M34 220L66 196M286 220L254 196"
        stroke="#E03C31"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M62 250V116C62 55 102 20 160 20C218 20 258 55 258 116V250" fill={BONE} stroke={INK} strokeWidth="5" />
      <path d="M68 188C42 172 28 184 36 204C42 218 62 218 76 212" fill={BONE} stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M252 188C278 172 292 184 284 204C278 218 258 218 244 212" fill={BONE} stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="122" cy="108" rx="28" ry="34" fill={INK} stroke="#E03C31" strokeWidth="6" />
      <ellipse cx="198" cy="108" rx="28" ry="34" fill={INK} stroke="#E03C31" strokeWidth="6" />
      <circle cx="122" cy="108" r="7" fill="#E03C31" />
      <circle cx="198" cy="108" r="7" fill="#E03C31" />
      <circle cx="125" cy="105" r="2.5" fill={BONE} />
      <circle cx="201" cy="105" r="2.5" fill={BONE} />
      <path d="M104 166C116 146 204 146 216 166C222 198 198 228 160 228C122 228 98 198 104 166Z" fill={INK} stroke="#E03C31" strokeWidth="4" />
      <path d="M126 212C140 198 180 198 194 212" stroke="#E03C31" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
