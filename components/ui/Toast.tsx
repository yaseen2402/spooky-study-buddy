'use client';

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div role="status" className="toast">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss warning">
        ×
      </button>
    </div>
  );
}
