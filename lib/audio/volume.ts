export const START_VOLUME = 0.1;
export const VOLUME_STEP = 0.1;
export const ESCALATION_INTERVAL_MS = 30_000;

/** One escalation step: +10%, capped at 100%, rounded to one decimal to avoid float creep. */
export function nextVolume(v: number): number {
  const base = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  return Math.min(1, Math.round((base + VOLUME_STEP) * 10) / 10);
}
