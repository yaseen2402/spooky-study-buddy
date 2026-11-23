'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { SessionAction, SessionState } from '@/lib/types';
import { initialState, sessionReducer } from './sessionReducer';
import { read, write } from './localStorageSync';

const WRITE_DEBOUNCE_MS = 300;

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  hydrated: boolean;
  storageWarning: string | null;
  dismissStorageWarning: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const writeFailedOnce = useRef(false);

  // Restore after mount so server and first client render match.
  useEffect(() => {
    const result = read();
    if (result.status === 'ok') {
      dispatch({ type: 'RESTORE_STATE', persisted: result.data, now: Date.now() });
    } else if (result.status === 'corrupt') {
      setStorageWarning('Your saved session was corrupted, so the ghost started a fresh one.');
    }
    setHydrated(true);
  }, []);

  // Debounced mirror to localStorage.
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      if (!write(state) && !writeFailedOnce.current) {
        writeFailedOnce.current = true;
        setStorageWarning("Couldn't save to this browser's storage — progress may not survive a refresh.");
      }
    }, WRITE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  // Flush pending write when the page is going away.
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => write(latest.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [hydrated]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      hydrated,
      storageWarning,
      dismissStorageWarning: () => setStorageWarning(null),
    }),
    [state, hydrated, storageWarning],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
