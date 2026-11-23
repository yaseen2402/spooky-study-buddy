'use client';

import { useId } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import type { Task } from '@/lib/types';

export function TaskItem({ task }: { task: Task }) {
  const { dispatch } = useSession();
  const checkboxId = useId();

  return (
    <li className="group flex items-center gap-3 rounded-lg border border-crypt-700 bg-crypt-900/70 px-3 py-2">
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.completed}
        onChange={() => dispatch({ type: 'TOGGLE_TASK', id: task.id, now: Date.now() })}
        className="h-5 w-5 shrink-0 accent-ecto-400"
      />
      <label
        htmlFor={checkboxId}
        className={`min-w-0 flex-1 cursor-pointer break-words ${
          task.completed ? 'text-bone/60 line-through decoration-ecto-400 decoration-2' : 'text-bone'
        }`}
      >
        {task.name}
        {task.completed && <span className="sr-only"> (completed)</span>}
      </label>
      <button
        type="button"
        onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })}
        aria-label={`Delete task: ${task.name}`}
        className="rounded-md px-2 py-1 text-bone/70 hover:bg-blood-700/30 hover:text-blood-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
      >
        <span aria-hidden>✕</span>
      </button>
    </li>
  );
}
