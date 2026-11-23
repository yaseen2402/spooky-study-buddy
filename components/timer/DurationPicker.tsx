'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';

export function DurationPicker() {
  const { state, dispatch } = useSession();
  const minutes = Math.round(state.durationSeconds / 60);
  const [draft, setDraft] = useState(String(minutes));

  useEffect(() => setDraft(String(minutes)), [minutes]);

  if (state.timerStatus !== 'stopped' || state.sessionEnded) return null;

  const commit = (value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n) || value.trim() === '') {
      setDraft(String(minutes));
      return;
    }
    dispatch({ type: 'SET_DURATION', minutes: Math.min(120, Math.max(1, Math.round(n))) });
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="duration-range" className="text-sm font-medium text-bone/90">
          Session length
        </label>
        <div className="flex items-center gap-2">
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
            className="w-16 rounded-md border border-crypt-600 bg-crypt-900 px-2 py-1 text-right text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
          />
          <span className="text-sm text-bone/80">min</span>
        </div>
      </div>
      <input
        id="duration-range"
        type="range"
        min={1}
        max={120}
        value={minutes}
        onChange={(e) => dispatch({ type: 'SET_DURATION', minutes: Number(e.target.value) })}
        aria-valuetext={`${minutes} minutes`}
        className="w-full accent-ecto-400"
      />
    </div>
  );
}
