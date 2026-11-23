import { MAX_TASK_NAME_LENGTH, type GhostRoastRequest } from '@/lib/types';

export type ValidationResult = { ok: true; value: GhostRoastRequest } | { ok: false; error: string };

export function validateRoastRequest(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const { taskName, slackingDuration, mode } = body as Record<string, unknown>;

  if (typeof taskName !== 'string' || taskName.trim().length === 0) {
    return { ok: false, error: '`taskName` must be a non-empty string.' };
  }
  if (taskName.length > MAX_TASK_NAME_LENGTH) {
    return { ok: false, error: `\`taskName\` must be at most ${MAX_TASK_NAME_LENGTH} characters.` };
  }
  if (typeof slackingDuration !== 'number' || !Number.isFinite(slackingDuration) || slackingDuration < 0) {
    return { ok: false, error: '`slackingDuration` must be a non-negative number of seconds.' };
  }
  if (mode !== 'roast' && mode !== 'congratulate') {
    return { ok: false, error: '`mode` must be "roast" or "congratulate".' };
  }
  return { ok: true, value: { taskName: taskName.trim(), slackingDuration, mode } };
}
