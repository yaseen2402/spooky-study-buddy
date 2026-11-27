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
    <div>
      <form onSubmit={submit} noValidate className="task-form">
        <label htmlFor={inputId} className="sr-only">
          New task
        </label>
        <input
          id={inputId}
          type="text"
          className="task-input"
          value={value}
          maxLength={MAX_TASK_NAME_LENGTH}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Add a study task..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button type="submit" className="btn-add-task">
          Add
        </button>
      </form>
      {error && (
        <p id={errorId} role="alert" className="form-error mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
