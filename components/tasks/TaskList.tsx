'use client';

import { useSession } from '@/lib/session/SessionContext';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const { state } = useSession();
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.completed).length;
  const watchedId = state.tasks.find((t) => !t.completed)?.id;

  return (
    <section className="tasks-section" aria-labelledby="tasks-heading">
      <div className="section-header">
        <h2 id="tasks-heading" className="section-title">
          Tasks
        </h2>
        <span className="section-meta">
          {done}/{total}
        </span>
      </div>

      <TaskInput />

      {total === 0 ? (
        <p className="tasks-empty">Nothing to haunt yet.</p>
      ) : (
        <ol className="task-list">
          {state.tasks.map((t) => (
            <TaskItem key={t.id} task={t} watched={t.id === watchedId} />
          ))}
        </ol>
      )}
    </section>
  );
}
