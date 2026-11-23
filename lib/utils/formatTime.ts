const pad = (n: number) => String(n).padStart(2, '0');

const whole = (seconds: number) => (Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0);

/** 90 → "01:30". Minutes are not capped at 59, so 7200 → "120:00". */
export function toMMSS(seconds: number): string {
  const s = whole(seconds);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** 3661 → "01:01:01". */
export function toHHMMSS(seconds: number): string {
  const s = whole(seconds);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
