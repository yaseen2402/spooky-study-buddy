import { getFallbackFeynman } from '@/lib/roast/fallbackRoasts';
import type { FeynmanRequest, FeynmanResponse } from '@/lib/types';

/**
 * Calls /api/ghost-evaluate and returns a FeynmanResponse.
 * Always resolves — returns the fallback on any error.
 */
export async function fetchEvaluation(
  req: FeynmanRequest,
  signal?: AbortSignal,
): Promise<FeynmanResponse> {
  try {
    const res = await fetch('/api/ghost-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok) return { ...getFallbackFeynman(), source: 'fallback' };
    const data = (await res.json()) as FeynmanResponse;
    if (!data.feedback || !data.clear || !data.missing || !data.simplifyPrompt) {
      return { ...getFallbackFeynman(), source: 'fallback' };
    }
    return data;
  } catch {
    return { ...getFallbackFeynman(), source: 'fallback' };
  }
}
