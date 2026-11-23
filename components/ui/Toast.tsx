'use client';

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-xl border border-pumpkin-400/60 bg-crypt-800 px-4 py-3 text-sm text-bone shadow-xl"
    >
      <span aria-hidden>⚠️</span>
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss warning"
        className="rounded px-1 text-bone/80 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
      >
        ✕
      </button>
    </div>
  );
}
