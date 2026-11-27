'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { currentTaskName } from '@/lib/session/selectors';

const MAX_NOTES_CHARS = 10_000;

export function SessionNotes() {
  const { state, dispatch } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(statusTimer.current);
      clearTimeout(confirmTimer.current);
    },
    [],
  );

  const hasNotes = state.notes.trim().length > 0;
  const nearLimit = state.notes.length > MAX_NOTES_CHARS * 0.9;

  function flash(msg: string) {
    setStatus(msg);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(''), 2000);
  }

  async function handleCopy() {
    if (!hasNotes) return;
    try {
      await navigator.clipboard.writeText(state.notes);
      flash('Copied');
    } catch {
      textareaRef.current?.select();
    }
  }

  function handleExport() {
    if (!hasNotes) return;
    const task = currentTaskName(state);
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([`# Study Notes — ${task}\n_${date}_\n\n${state.notes}`], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-notes-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Exported');
  }

  // Two-step clear: first click arms it, second click (within 3 s) clears.
  function handleClear() {
    if (!hasNotes) return;
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmClear(false);
    dispatch({ type: 'SET_NOTES', notes: '' });
    textareaRef.current?.focus();
    flash('Cleared');
  }

  return (
    <>
      <textarea
        ref={textareaRef}
        className="notes-textarea"
        value={state.notes}
        onChange={(e) => dispatch({ type: 'SET_NOTES', notes: e.target.value.slice(0, MAX_NOTES_CHARS) })}
        placeholder="Jot formulas, page numbers, half-formed thoughts..."
        aria-label="Session notes scratchpad"
        maxLength={MAX_NOTES_CHARS}
      />
      <div className="utility-bar">
        <div className="utility-actions">
          <button type="button" className="btn-mini" onClick={handleCopy} disabled={!hasNotes}>
            Copy
          </button>
          <button type="button" className="btn-mini" onClick={handleExport} disabled={!hasNotes}>
            Export .md
          </button>
          <button
            type="button"
            className={`btn-mini${confirmClear ? ' danger-confirm' : ''}`}
            onClick={handleClear}
            disabled={!hasNotes}
          >
            {confirmClear ? 'Click again to clear' : 'Clear'}
          </button>
        </div>
        <span className={`utility-status${nearLimit && !status ? ' warn' : ''}`} aria-live="polite">
          {status || (nearLimit ? `${state.notes.length}/${MAX_NOTES_CHARS}` : '')}
        </span>
      </div>
    </>
  );
}
