'use client';

import { useRef, useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { currentTaskName } from '@/lib/session/selectors';

const MAX_NOTES_CHARS = 10_000;

export function SessionNotes() {
  const { state, dispatch } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = state.notes.trim() ? state.notes.trim().split(/\s+/).length : 0;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    dispatch({ type: 'SET_NOTES', notes: e.target.value.slice(0, MAX_NOTES_CHARS) });
  }

  function handleClear() {
    if (!state.notes.trim()) return;
    if (typeof window !== 'undefined' && !window.confirm('Clear all notes? This cannot be undone.')) return;
    dispatch({ type: 'SET_NOTES', notes: '' });
    textareaRef.current?.focus();
  }

  async function handleCopy() {
    if (!state.notes.trim()) return;
    try {
      await navigator.clipboard.writeText(state.notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select all text
      textareaRef.current?.select();
    }
  }

  function handleExport() {
    if (!state.notes.trim()) return;
    const task = currentTaskName(state);
    const date = new Date().toISOString().slice(0, 10);
    const header = `# Study Notes — ${task}\n_${date}_\n\n`;
    const content = header + state.notes;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-notes-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasNotes = state.notes.trim().length > 0;
  const nearLimit = state.notes.length > MAX_NOTES_CHARS * 0.9;

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-bone/60">
          Auto-saved to this session.{' '}
          {hasNotes && (
            <span>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
              {nearLimit && (
                <span className="ml-1 text-pumpkin-400">
                  ({state.notes.length}/{MAX_NOTES_CHARS})
                </span>
              )}
            </span>
          )}
        </p>
        <div className="flex gap-1.5">
          <ActionButton onClick={handleCopy} disabled={!hasNotes} title="Copy notes to clipboard">
            {copied ? '✓ Copied' : '📋 Copy'}
          </ActionButton>
          <ActionButton onClick={handleExport} disabled={!hasNotes} title="Export as Markdown file">
            ⬇️ Export
          </ActionButton>
          <ActionButton
            onClick={handleClear}
            disabled={!hasNotes}
            title="Clear all notes"
            danger
          >
            🗑 Clear
          </ActionButton>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={state.notes}
        onChange={handleChange}
        placeholder="Jot down anything — key formulas, questions, things to revisit…&#10;&#10;The ghost is watching. Take good notes."
        aria-label="Session notes scratchpad"
        maxLength={MAX_NOTES_CHARS}
        rows={10}
        className="w-full resize-none rounded-xl border border-crypt-700 bg-crypt-950/60 px-4 py-3 font-mono text-sm text-bone placeholder:text-bone/30 focus:border-ecto-500/70 focus:outline-none focus:ring-1 focus:ring-ecto-500/40 transition-colors"
        style={{ minHeight: '14rem' }}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-blood-500/40 text-blood-400 hover:bg-blood-700/20'
          : 'border-crypt-600 text-bone/70 hover:bg-crypt-700 hover:text-bone'
      }`}
    >
      {children}
    </button>
  );
}
