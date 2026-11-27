'use client';

import type { PermissionState } from '@/lib/notifications/NotificationService';
import { BellIcon, BellOffIcon, MotionIcon, SoundOffIcon, SoundOnIcon } from './Icons';

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
      <button type="button" className="icon-toggle" disabled aria-label="Audio unavailable">
        <SoundOffIcon />
        <span className="tooltip">Audio unavailable</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="icon-toggle"
      aria-pressed={!muted}
      aria-label="Sound effects"
      onClick={() => onChange(!muted)}
    >
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      <span className="tooltip">Sound: {muted ? 'Off' : 'On'}</span>
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
      className="icon-toggle"
      aria-pressed={on}
      aria-label="Reduce motion"
      disabled={osPrefers}
      onClick={() => onChange(!manual)}
    >
      <MotionIcon />
      <span className="tooltip">Reduce Motion: {osPrefers ? 'On (system)' : on ? 'On' : 'Off'}</span>
    </button>
  );
}

const NOTIF_TIP: Record<PermissionState, string> = {
  granted: 'Alerts: On',
  default: 'Alerts: Off — click to allow',
  denied: 'Alerts blocked in browser settings',
  unsupported: 'Alerts not supported',
};

export function NotificationToggle({
  permission,
  onRequest,
}: {
  permission: PermissionState;
  onRequest: () => void;
}) {
  const granted = permission === 'granted';
  const blocked = permission === 'denied' || permission === 'unsupported';
  return (
    <button
      type="button"
      className="icon-toggle"
      aria-pressed={granted}
      aria-label="Notifications"
      disabled={blocked}
      onClick={permission === 'default' ? onRequest : undefined}
    >
      {blocked ? <BellOffIcon /> : <BellIcon />}
      <span className="tooltip">{NOTIF_TIP[permission]}</span>
    </button>
  );
}
