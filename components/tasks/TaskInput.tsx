'use client';

import { useId, useState, type FormEvent } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { MAX_TASK_NAME_LENGTH } from '@/lib/types';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function TaskInput() {
  const { dispatch } = useSession();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) {
      setError('Even ghosts need something to haunt — give the task a name.');
      return;
    }
    dispatch({ type: 'ADD_TASK', id: newId(), name, now: Date.now() });
    setValue('');
    setError(null);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-1">
      <label htmlFor={inputId} className="sr-only">
        New task
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          maxLength={MAX_TASK_NAME_LENGTH}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Chapter 4: Organic chemistry"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 rounded-lg border border-crypt-600 bg-crypt-900 px-3 py-2 text-bone placeholder:text-bone/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-pumpkin-400 px-4 py-2 font-semibold text-crypt-950 hover:bg-pumpkin-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400"
        >
          Add
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-blood-400">
          {error}
        </p>
      )}
    </form>
  );
}
