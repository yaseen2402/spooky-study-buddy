'use client';

import type { PermissionState } from '@/lib/notifications/NotificationService';

const base =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400 disabled:opacity-60';

export function MuteToggle({
  muted,
  supported,
  onChange,
}: {
  muted: boolean;
  supported: boolean;
  onChange: (muted: boolean) => void;
}) {
  if (!supported) {
    return (
      <span className={`${base} border-crypt-600 text-bone/70`} role="status">
        <span aria-hidden>🔇</span> Audio unavailable
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={muted}
      onClick={() => onChange(!muted)}
      className={`${base} ${muted ? 'border-crypt-600 bg-crypt-800 text-bone/80' : 'border-ecto-500/60 bg-crypt-800 text-ecto-300'}`}
    >
      <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
      {muted ? 'Sound off' : 'Sound on'}
    </button>
  );
}

export function ReduceMotionToggle({
  manual,
  osPrefers,
  onChange,
}: {
  manual: boolean;
  osPrefers: boolean;
  onChange: (value: boolean) => void;
}) {
  const on = manual || osPrefers;
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={osPrefers}
      title={osPrefers ? 'Reduced motion is on from your system settings' : undefined}
      onClick={() => onChange(!manual)}
      className={`${base} ${on ? 'border-pumpkin-400/70 bg-crypt-800 text-pumpkin-400' : 'border-crypt-600 bg-crypt-800 text-bone/80'}`}
    >
      <span aria-hidden>{on ? '🧘' : '✨'}</span>
      Reduce motion{osPrefers ? ' (system)' : ''}
    </button>
  );
}

const NOTIF_CONFIG: Record<
  PermissionState,
  { icon: string; label: string; title: string; classes: string; clickable: boolean }
> = {
  granted: {
    icon: '🔔',
    label: 'Notifs on',
    title: 'Desktop notifications are enabled',
    classes: 'border-ecto-500/60 bg-crypt-800 text-ecto-300',
    clickable: false,
  },
  denied: {
    icon: '🔕',
    label: 'Notifs blocked',
    title: 'Notifications are blocked. Enable them in your browser settings.',
    classes: 'border-blood-500/40 bg-crypt-800 text-blood-400',
    clickable: false,
  },
  default: {
    icon: '🔔',
    label: 'Enable notifs',
    title: 'Click to request notification permission',
    classes: 'border-crypt-600 bg-crypt-800 text-bone/70 hover:border-ecto-500/60 hover:text-ecto-300',
    clickable: true,
  },
  unsupported: {
    icon: '🔕',
    label: 'No notifs',
    title: 'Notifications are not supported in this browser',
    classes: 'border-crypt-600 text-bone/40',
    clickable: false,
  },
};

export function NotificationToggle({
  permission,
  onRequest,
}: {
  permission: PermissionState;
  onRequest: () => void;
}) {
  const cfg = NOTIF_CONFIG[permission];
  if (cfg.clickable) {
    return (
      <button
        type="button"
        onClick={onRequest}
        title={cfg.title}
        className={`${base} ${cfg.classes}`}
      >
        <span aria-hidden>{cfg.icon}</span>
        {cfg.label}
      </button>
    );
  }
  return (
    <span className={`${base} ${cfg.classes}`} role="status" title={cfg.title}>
      <span aria-hidden>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
