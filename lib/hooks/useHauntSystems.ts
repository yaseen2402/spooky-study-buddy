'use client';

import { useEffect, useRef, type Dispatch, type MutableRefObject } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { IdleDetector } from '@/lib/detection/IdleDetector';
import { VisibilityMonitor } from '@/lib/detection/VisibilityMonitor';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { getFallback } from '@/lib/roast/fallbackRoasts';
import { fetchRoast } from '@/lib/roast/ghostRoastClient';
import { currentTaskName } from '@/lib/session/selectors';
import type { SessionAction, SessionState } from '@/lib/types';
import { restoreFavicon, setCreepyFavicon, startTitleFlash, stopTitleFlash } from '@/lib/utils/tabEffects';

export const IDLE_THRESHOLD_MS = 60_000;
export const ROAST_DELAY_MS = 10_000;

export interface HauntServices {
  audio: AudioEngine;
  notifications: NotificationService;
}

/** Lazily created singletons for the browser-only services. */
export function useHauntServices(): MutableRefObject<HauntServices | null> {
  const ref = useRef<HauntServices | null>(null);
  if (ref.current === null && typeof window !== 'undefined') {
    ref.current = { audio: new AudioEngine(), notifications: new NotificationService() };
  }
  return ref;
}

/** 1 s ticker while running, plus an immediate tick whenever the tab becomes visible again. */
export function useTimerTicker(state: SessionState, dispatch: Dispatch<SessionAction>) {
  const running = state.timerStatus === 'running';
  useEffect(() => {
    if (!running) return;
    const tick = () => dispatch({ type: 'TICK', now: Date.now() });
    tick();
    const id = window.setInterval(tick, 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running, dispatch]);
}

/** Tab-switch + idle detection, only while the timer runs. */
export function useSlackDetection(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
  reducedMotion: boolean,
) {
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const running = state.timerStatus === 'running';

  useEffect(() => {
    if (!running) return;
    const start = (source: 'idle' | 'visibility') =>
      dispatch({ type: 'SLACK_START', source, now: Date.now() });
    const end = () => dispatch({ type: 'SLACK_END', now: Date.now(), jumpscare: !reducedRef.current });

    const idle = new IdleDetector(IDLE_THRESHOLD_MS, () => start('idle'), end);
    const visibility = new VisibilityMonitor(
      () => {
        idle.suspend();
        start('visibility');
      },
      () => {
        end();
        idle.resume();
      },
    );
    idle.start();
    visibility.start();
    return () => {
      visibility.stop();
      idle.stop();
    };
  }, [running, dispatch]);
}

/** Audio, tab title/favicon, notifications and roasts that react to haunt state. */
export function useHauntEffects(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
  services: MutableRefObject<HauntServices | null>,
) {
  const { hauntMode, slackStartedAt, muted, sessionEnded } = state;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    services.current?.audio.setMuted(muted);
  }, [muted, services]);

  // Haunt on/off: audio, tab effects, immediate notification, delayed AI roast.
  useEffect(() => {
    const svc = services.current;
    if (!svc || !hauntMode || slackStartedAt === null) return;

    const tag = `ssb-slack-${slackStartedAt}`;
    svc.audio.start();
    startTitleFlash();
    setCreepyFavicon();
    svc.notifications.notify(getFallback('roast'), tag);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const s = stateRef.current;
      const slackingDuration = Math.max(0, Math.round((Date.now() - slackStartedAt) / 1000));
      const message =
        (await fetchRoast(
          { taskName: currentTaskName(s), slackingDuration, mode: 'roast' },
          controller.signal,
        )) ?? getFallback('roast');
      if (controller.signal.aborted) return;
      dispatch({ type: 'SET_ROAST', message });
      if (document.visibilityState === 'hidden') svc.notifications.notify(message, tag);
    }, ROAST_DELAY_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      svc.audio.stop();
      stopTitleFlash();
      restoreFavicon();
    };
  }, [hauntMode, slackStartedAt, dispatch, services]);

  // Session end: congratulation (AI or fallback), plus a nudge if the tab is hidden.
  useEffect(() => {
    if (!sessionEnded) return;
    const controller = new AbortController();
    const s = stateRef.current;
    if (document.visibilityState === 'hidden') {
      services.current?.notifications.notify('Session complete! Come collect your Survival Report.', 'ssb-done');
    }
    void (async () => {
      const message =
        (await fetchRoast(
          { taskName: currentTaskName(s), slackingDuration: 0, mode: 'congratulate' },
          controller.signal,
        )) ?? getFallback('congratulate');
      if (!controller.signal.aborted) dispatch({ type: 'SET_ROAST', message });
    })();
    return () => controller.abort();
  }, [sessionEnded, dispatch, services]);

  // Jumpscare lasts a moment, then the ghost settles.
  useEffect(() => {
    if (state.jumpscareUntil === null) return;
    const ms = Math.max(0, state.jumpscareUntil - Date.now());
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_JUMPSCARE' }), ms);
    return () => window.clearTimeout(id);
  }, [state.jumpscareUntil, dispatch]);
}
