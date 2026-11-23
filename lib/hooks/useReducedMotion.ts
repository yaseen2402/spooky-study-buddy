'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'ssb_reduce_motion';

function readManual(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

/** Combines the OS `prefers-reduced-motion` setting with a per-viewer manual override. */
export function useReducedMotion() {
  const [osPrefers, setOsPrefers] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    setManual(readManual());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setOsPrefers(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsPrefers(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = manual ? 'true' : 'false';
  }, [manual]);

  const setManualOverride = useCallback((value: boolean) => {
    setManual(value);
    try {
      window.localStorage.setItem(KEY, String(value));
    } catch {
      // per-viewer convenience only
    }
  }, []);

  return { reduced: osPrefers || manual, osPrefers, manual, setManual: setManualOverride };
}
