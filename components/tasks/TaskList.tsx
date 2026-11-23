'use client';

import { useSession } from '@/lib/session/SessionContext';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const { state } = useSession();
  const done = state.tasks.filter((t) => t.completed).length;

  return (
    <section aria-labelledby="tasks-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="tasks-heading" className="font-display text-2xl text-pumpkin-400">
          Tasks to haunt
        </h2>
        {state.tasks.length > 0 && (
          <span className="text-sm text-bone/80">
            {done}/{state.tasks.length} done
          </span>
        )}
      </div>
      <TaskInput />
      {state.tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-crypt-600 px-3 py-6 text-center text-sm text-bone/70">
          No tasks yet. The ghost gets bored without a target.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {state.tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </ol>
      )}
    </section>
  );
}
