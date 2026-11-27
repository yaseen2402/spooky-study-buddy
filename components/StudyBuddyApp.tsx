'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { GhostCompanion } from '@/components/ghost/GhostCompanion';
import { RoastBubble } from '@/components/ghost/RoastBubble';
import { HauntOverlay } from '@/components/haunt/HauntOverlay';
import { JumpscareFlash } from '@/components/haunt/JumpscareFlash';
import { SurvivalReport } from '@/components/report/SurvivalReport';
import { TaskList } from '@/components/tasks/TaskList';
import { StageControls } from '@/components/timer/StageControls';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { Doodles } from '@/components/ui/Doodles';
import { EyeIcon, GhostMark } from '@/components/ui/Icons';
import { Toast } from '@/components/ui/Toast';
import { MuteToggle, NotificationToggle, ReduceMotionToggle } from '@/components/ui/Toggles';
import { StudyWorkspace } from '@/components/workspace/StudyWorkspace';
import {
  useHauntEffects,
  useHauntServices,
  useSlackDetection,
  useTimerTicker,
} from '@/lib/hooks/useHauntSystems';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useSession } from '@/lib/session/SessionContext';
import { ghostStateOf } from '@/lib/session/selectors';
import type { GhostState, SessionState } from '@/lib/types';

type StageState = 'idle' | 'studying' | 'final' | 'haunted';

/** Reactively reads the current notification permission from the NotificationService. */
function useNotificationPermission(services: ReturnType<typeof useHauntServices>) {
  return useSyncExternalStore(
    (cb) => {
      // Re-read permission on every visibilitychange (user may have changed browser settings)
      document.addEventListener('visibilitychange', cb);
      return () => document.removeEventListener('visibilitychange', cb);
    },
    () => services.current?.notifications.permission ?? 'unsupported',
    () => 'unsupported' as const,
  );
}

function stageOf(ghost: GhostState): StageState {
  if (ghost === 'haunting' || ghost === 'jumpscare') return 'haunted';
  if (ghost === 'tense') return 'final';
  if (ghost === 'calm') return 'studying';
  return 'idle';
}

/** What the ghost says when it isn't roasting you. */
function stageLine(stage: StageState, state: SessionState): string {
  if (state.currentRoast && !state.sessionEnded) return state.currentRoast;
  if (stage === 'haunted') {
    const task = state.tasks.find((t) => !t.completed)?.name;
    return task ? `Caught you. Back to “${task}”, now.` : 'Caught you. Back to work, now.';
  }
  if (stage === 'final') return "Five minutes left. Don't fold now.";
  if (state.timerStatus === 'paused') return "Paused. Don't make this a two-hour break.";
  if (stage === 'studying') return "Quiet hours. You read, I'll keep watch.";
  return "Pick a duration. I'll haunt you if you wander off.";
}

export function StudyBuddyApp() {
  const { state, dispatch, hydrated, storageWarning, dismissStorageWarning } = useSession();
  const motion = useReducedMotion();
  const services = useHauntServices();
  const notifPermission = useNotificationPermission(services);

  useTimerTicker(state, dispatch);
  useSlackDetection(state, dispatch, motion.reduced);
  useHauntEffects(state, dispatch, services);

  const onUserGesture = useCallback(() => {
    services.current?.audio.unlock();
    void services.current?.notifications.requestPermissionIfNeeded();
  }, [services]);

  const requestNotifications = useCallback(async () => {
    await services.current?.notifications.requestPermissionIfNeeded();
  }, [services]);

  if (!hydrated) {
    return (
      <main className="summoning" aria-busy="true">
        <GhostMark size={40} />
        <p>Summoning your ghost…</p>
      </main>
    );
  }

  const ghost = ghostStateOf(state, Date.now());
  const stage = stageOf(ghost);
  const watched = state.tasks.find((t) => !t.completed);
  const active = state.timerStatus !== 'stopped';

  return (
    <div className="app" data-state={stage}>
      <HauntOverlay active={state.hauntMode} />

      <header className="topbar">
        <div className="brand">
          <GhostMark />
          <h1 className="brand-title">Spooky Study Buddy</h1>
        </div>
        <div className="settings-group">
          <MuteToggle
            muted={state.muted}
            supported={services.current?.audio.supported ?? false}
            onChange={(muted) => dispatch({ type: 'SET_MUTED', muted })}
          />
          <NotificationToggle permission={notifPermission} onRequest={requestNotifications} />
          <ReduceMotionToggle manual={motion.manual} osPrefers={motion.osPrefers} onChange={motion.setManual} />
        </div>
      </header>

      <main className="workspace">
        {/* LEFT: THE STAGE */}
        <section className="stage-pane" aria-label="Ghost and timer">
          <Doodles />
          <div className="stage-header">
            <div className="watching-indicator">
              <EyeIcon />
              {watched ? (
                <span className="watching-task-name">
                  <span className="sr-only">The ghost is watching: </span>
                  {watched.name}
                </span>
              ) : (
                <span className="watching-empty">No tasks yet — add one so I know what you&rsquo;re avoiding.</span>
              )}
            </div>
            {active && (
              <>
                <p className="sr-only">Times haunted this session: {state.slackingOffCount}</p>
                {state.slackingOffCount > 0 && (
                  <span className="haunt-counter" aria-hidden>
                    Haunted ×{state.slackingOffCount}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="stage-center">
            <RoastBubble message={stageLine(stage, state)} />
            <GhostCompanion state={ghost} reducedMotion={motion.reduced} />
            <TimerDisplay />
          </div>

          <StageControls onUserGesture={onUserGesture} haunted={stage === 'haunted'} />
        </section>

        {/* RIGHT: THE DESK */}
        <aside className="desk-pane" aria-label="Tasks and study workspace">
          <TaskList />
          <StudyWorkspace />
        </aside>
      </main>

      <JumpscareFlash active={ghost === 'jumpscare'} reducedMotion={motion.reduced} />
      <SurvivalReport state={state} onDismiss={() => dispatch({ type: 'DISMISS_REPORT' })} />
      <Toast message={storageWarning} onDismiss={dismissStorageWarning} />
    </div>
  );
}
