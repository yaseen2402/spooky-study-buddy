'use client';

import { useCallback } from 'react';
import { GhostCompanion } from '@/components/ghost/GhostCompanion';
import { RoastBubble } from '@/components/ghost/RoastBubble';
import { HauntOverlay } from '@/components/haunt/HauntOverlay';
import { JumpscareFlash } from '@/components/haunt/JumpscareFlash';
import { SurvivalReport } from '@/components/report/SurvivalReport';
import { TaskList } from '@/components/tasks/TaskList';
import { DurationPicker } from '@/components/timer/DurationPicker';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { Toast } from '@/components/ui/Toast';
import { MuteToggle, ReduceMotionToggle } from '@/components/ui/Toggles';
import {
  useHauntEffects,
  useHauntServices,
  useSlackDetection,
  useTimerTicker,
} from '@/lib/hooks/useHauntSystems';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useSession } from '@/lib/session/SessionContext';
import { ghostStateOf } from '@/lib/session/selectors';

export function StudyBuddyApp() {
  const { state, dispatch, hydrated, storageWarning, dismissStorageWarning } = useSession();
  const motion = useReducedMotion();
  const services = useHauntServices();

  useTimerTicker(state, dispatch);
  useSlackDetection(state, dispatch, motion.reduced);
  useHauntEffects(state, dispatch, services);

  const onUserGesture = useCallback(() => {
    services.current?.audio.unlock();
    void services.current?.notifications.requestPermissionIfNeeded();
  }, [services]);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center" aria-busy="true">
        <p className="animate-pulse text-bone/80">Summoning your ghost…</p>
      </main>
    );
  }

  const ghost = ghostStateOf(state, Date.now());
  const angry = ghost === 'haunting' || ghost === 'jumpscare';

  return (
    <>
      <main className={`mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10 ${state.hauntMode ? 'haunt-shake' : ''}`}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl text-ecto-400 sm:text-5xl">
            Spooky Study Buddy <span aria-hidden>👻</span>
          </h1>
          <div className="flex flex-wrap gap-2">
            <MuteToggle
              muted={state.muted}
              supported={services.current?.audio.supported ?? false}
              onChange={(muted) => dispatch({ type: 'SET_MUTED', muted })}
            />
            <ReduceMotionToggle manual={motion.manual} osPrefers={motion.osPrefers} onChange={motion.setManual} />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <section
            aria-label="Ghost and timer"
            className="flex flex-col items-center gap-5 rounded-3xl border border-crypt-700 bg-crypt-900/80 p-6 shadow-xl"
          >
            <RoastBubble message={state.sessionEnded ? null : state.currentRoast} angry={angry} />
            <GhostCompanion state={ghost} reducedMotion={motion.reduced} />
            <TimerDisplay onUserGesture={onUserGesture} />
            <DurationPicker />
            {state.timerStatus !== 'stopped' && (
              <p className="text-sm text-bone/80">
                Times haunted this session:{' '}
                <strong className="text-blood-400">{state.slackingOffCount}</strong>
              </p>
            )}
          </section>

          <div className="rounded-3xl border border-crypt-700 bg-crypt-900/80 p-6 shadow-xl">
            <TaskList />
          </div>
        </div>

        <footer className="text-center text-xs text-bone/70">
          Switch tabs or go idle for 60 s while the timer runs and the ghost will come for you.
        </footer>
      </main>

      <HauntOverlay active={state.hauntMode} />
      <JumpscareFlash active={ghost === 'jumpscare'} reducedMotion={motion.reduced} />
      <SurvivalReport state={state} onDismiss={() => dispatch({ type: 'DISMISS_REPORT' })} />
      <Toast message={storageWarning} onDismiss={dismissStorageWarning} />
    </>
  );
}
