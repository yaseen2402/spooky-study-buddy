'use client';

export function RoastBubble({ message, angry }: { message: string | null; angry: boolean }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="min-h-[4.5rem] w-full max-w-sm">
      {message && (
        <div
          className={`roast-bubble relative rounded-2xl border px-4 py-3 text-center text-[0.95rem] leading-snug shadow-lg ${
            angry ? 'border-blood-500/70 bg-crypt-800 text-bone' : 'border-ecto-500/60 bg-crypt-800 text-bone'
          }`}
        >
          <span className="sr-only">The ghost says: </span>
          {message}
          <span
            aria-hidden
            className={`absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r bg-crypt-800 ${
              angry ? 'border-blood-500/70' : 'border-ecto-500/60'
            }`}
          />
        </div>
      )}
    </div>
  );
}
