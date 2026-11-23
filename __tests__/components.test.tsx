import { act, fireEvent, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { StudyBuddyApp } from '@/components/StudyBuddyApp';
import { SurvivalReport } from '@/components/report/SurvivalReport';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { SessionProvider } from '@/lib/session/SessionContext';
import { completedThisSession, focusSeconds } from '@/lib/session/selectors';
import { sessionReducer } from '@/lib/session/sessionReducer';
import { toHHMMSS } from '@/lib/utils/formatTime';
import { T0, actionSeqArb, replay } from './arbitraries';

// jsdom lacks these.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

describe('SurvivalReport', () => {
  // Feature: spooky-study-buddy, Property 14: survival report displays all session data
  it('P14: shows focus time, every task completed this session, and the slack count', () => {
    fc.assert(
      fc.property(actionSeqArb, (actions) => {
        let s = replay(actions);
        if (!s.sessionEnded) s = sessionReducer({ ...s, sessionStartedAt: s.sessionStartedAt ?? T0 }, { type: 'FINISH_SESSION', now: T0 + 1e9 });
        if (!s.sessionEnded) return;
        const { unmount } = render(<SurvivalReport state={s} onDismiss={() => {}} />);
        expect(screen.getByTestId('focus-time')).toHaveTextContent(toHHMMSS(focusSeconds(s)));
        expect(screen.getByTestId('slack-count')).toHaveTextContent(String(s.slackingOffCount));
        const list = screen.queryByRole('list');
        for (const t of completedThisSession(s)) {
          expect(list).not.toBeNull();
          expect(list!.textContent).toContain(t.name);
        }
        unmount();
      }),
      { numRuns: 60 },
    );
  });
});

describe('NotificationService', () => {
  const original = (window as { Notification?: unknown }).Notification;
  afterEach(() => {
    (window as { Notification?: unknown }).Notification = original;
  });

  function mockNotification(permission: NotificationPermission) {
    const instances: { onclick: (() => void) | null; close: jest.Mock }[] = [];
    const Ctor = jest.fn().mockImplementation(() => {
      const n = { onclick: null, close: jest.fn() };
      instances.push(n);
      return n;
    }) as unknown as typeof Notification & jest.Mock;
    Object.assign(Ctor, { permission, requestPermission: jest.fn().mockResolvedValue('granted') });
    (window as { Notification?: unknown }).Notification = Ctor;
    return { Ctor, instances };
  }

  it('prompts at most once per page load, only when undecided', async () => {
    const { Ctor } = mockNotification('default');
    const svc = new NotificationService();
    await svc.requestPermissionIfNeeded();
    await svc.requestPermissionIfNeeded();
    expect(Ctor.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('never prompts once denied', async () => {
    const { Ctor } = mockNotification('denied');
    await new NotificationService().requestPermissionIfNeeded();
    expect(Ctor.requestPermission).not.toHaveBeenCalled();
    expect(new NotificationService().notify('boo')).toBeNull();
  });

  it('click focuses the window and closes the notification', () => {
    const { instances } = mockNotification('granted');
    const focus = jest.spyOn(window, 'focus').mockImplementation(() => {});
    new NotificationService().notify('boo', 'tag-1');
    instances[0].onclick!();
    expect(focus).toHaveBeenCalled();
    expect(instances[0].close).toHaveBeenCalled();
    focus.mockRestore();
  });
});

describe('StudyBuddyApp integration', () => {
  let hidden = false;
  beforeAll(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  });
  beforeEach(() => {
    hidden = false;
    document.title = 'Spooky Study Buddy';
    localStorage.clear();
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const setHidden = (value: boolean) => {
    hidden = value;
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  };

  async function mountAndStart() {
    render(
      <SessionProvider>
        <StudyBuddyApp />
      </SessionProvider>,
    );
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /start study session/i }));
  }

  it('tab switch haunts once; returning ends the haunt and keeps the count', async () => {
    await mountAndStart();
    setHidden(true);
    expect(document.title).toBe('👁️ I SEE YOU SLACKING...');
    expect(screen.getByText(/times haunted this session/i)).toHaveTextContent('1');
    setHidden(false);
    expect(document.title).toBe('Spooky Study Buddy');
    expect(screen.getByText(/times haunted this session/i)).toHaveTextContent('1');
  });

  it('being hidden past the idle threshold still counts only one slack', async () => {
    await mountAndStart();
    setHidden(true);
    act(() => {
      jest.advanceTimersByTime(65_000);
    });
    setHidden(false);
    expect(screen.getByText(/times haunted this session/i)).toHaveTextContent('1');
  });

  it('does not haunt when the timer is not running', async () => {
    render(
      <SessionProvider>
        <StudyBuddyApp />
      </SessionProvider>,
    );
    await act(async () => {});
    setHidden(true);
    expect(document.title).not.toBe('👁️ I SEE YOU SLACKING...');
    setHidden(false);
  });
});
