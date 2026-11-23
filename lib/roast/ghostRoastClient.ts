import type { GhostRoastRequest } from '@/lib/types';

/** Returns the roast text, or null on any failure (caller falls back to a bundled line). */
export async function fetchRoast(req: GhostRoastRequest, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch('/api/ghost-roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const message = (data as { message?: unknown })?.message;
    return typeof message === 'string' && message.trim() ? message.trim() : null;
  } catch {
    return null;
  }
}
