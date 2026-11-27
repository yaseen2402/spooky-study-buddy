'use client';

/** The ghost's comic-ink speech bubble. Restyled per state via `.app[data-state]`. */
export function RoastBubble({ message }: { message: string }) {
  return (
    <div className="speech-bubble-wrap" aria-live="polite" aria-atomic="true">
      <p key={message} className="speech-bubble">
        <span className="sr-only">The ghost says: </span>
        {message}
      </p>
    </div>
  );
}
