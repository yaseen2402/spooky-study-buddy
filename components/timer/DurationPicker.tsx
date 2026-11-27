'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';

const PRESETS = [15, 25, 45, 60];

export function DurationPicker() {
  const { state, dispatch } = useSession();
  const minutes = Math.round(state.durationSeconds / 60);
  const [draft, setDraft] = useState(String(minutes));

  useEffect(() => setDraft(String(minutes)), [minutes]);

  const set = (m: number) => dispatch({ type: 'SET_DURATION', minutes: m });

  const commit = (value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n) || value.trim() === '') {
      setDraft(String(minutes));
      return;
    }
    set(Math.min(120, Math.max(1, Math.round(n))));
  };

  return (
    <div className="preset-row" role="group" aria-label="Session length">
      {PRESETS.map((m) => (
        <button key={m} type="button" className="preset-btn" aria-pressed={m === minutes} onClick={() => set(m)}>
          {m}m
        </button>
      ))}
      <label className="custom-min-wrap">
        <input
          id="duration-number"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
          }}
          aria-label="Session length in minutes"
          className="custom-min-input"
        />
        <span className="custom-min-unit">min</span>
      </label>
    </div>
  );
}
