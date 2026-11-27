'use client';

import { useId } from 'react';
import { CheckIcon, EyeIcon } from '@/components/ui/Icons';
import { useSession } from '@/lib/session/SessionContext';
import type { Task } from '@/lib/types';

export function TaskItem({ task, watched = false }: { task: Task; watched?: boolean }) {
  const { dispatch } = useSession();
  const checkboxId = useId();

  return (
    <li className={`task-item${task.completed ? ' is-done' : ''}${watched ? ' is-watched' : ''}`}>
      <input
        id={checkboxId}
        type="checkbox"
        className="task-check sr-only"
        checked={task.completed}
        onChange={() => dispatch({ type: 'TOGGLE_TASK', id: task.id, now: Date.now() })}
      />
      <label htmlFor={checkboxId} className="task-label">
        <span className="task-checkbox" aria-hidden>
          {task.completed && <CheckIcon size={11} />}
        </span>
        <span className="task-text">
          {task.name}
          {task.completed && <span className="sr-only"> (completed)</span>}
        </span>
      </label>
      {watched && (
        <span className="watch-eye-icon" title="Ghost is watching this task">
          <EyeIcon size={14} />
          <span className="sr-only">The ghost is watching this task</span>
        </span>
      )}
      <button
        type="button"
        className="task-delete"
        onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })}
        aria-label={`Delete task: ${task.name}`}
      >
        ×
      </button>
    </li>
  );
}
