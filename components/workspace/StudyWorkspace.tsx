'use client';

import { useState } from 'react';
import { SessionNotes } from './SessionNotes';
import { FeynmanMode } from './FeynmanMode';
import { useSession } from '@/lib/session/SessionContext';

type Tab = 'notes' | 'feynman';

export function StudyWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const { state } = useSession();
  const hasNotes = state.notes.trim().length > 0;

  return (
    <section
      aria-labelledby="workspace-heading"
      className="flex flex-col rounded-3xl border border-crypt-700 bg-crypt-900/80 shadow-xl overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex border-b border-crypt-700" role="tablist" aria-label="Study workspace">
        <TabButton
          id="tab-notes"
          panelId="panel-notes"
          active={activeTab === 'notes'}
          onClick={() => setActiveTab('notes')}
        >
          <span aria-hidden>📝</span>
          Session Notes
          {hasNotes && (
            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ecto-400" aria-label="has notes" />
          )}
        </TabButton>
        <TabButton
          id="tab-feynman"
          panelId="panel-feynman"
          active={activeTab === 'feynman'}
          onClick={() => setActiveTab('feynman')}
        >
          <span aria-hidden>👻</span>
          Explain to the Ghost
        </TabButton>
      </div>

      {/* Panels */}
      <div
        id="panel-notes"
        role="tabpanel"
        aria-labelledby="tab-notes"
        hidden={activeTab !== 'notes'}
        className="flex-1"
      >
        <SessionNotes />
      </div>
      <div
        id="panel-feynman"
        role="tabpanel"
        aria-labelledby="tab-feynman"
        hidden={activeTab !== 'feynman'}
        className="flex-1"
      >
        <FeynmanMode />
      </div>
    </section>
  );
}

function TabButton({
  id,
  panelId,
  active,
  onClick,
  children,
}: {
  id: string;
  panelId: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400 ${
        active
          ? 'border-b-2 border-ecto-400 text-ecto-300'
          : 'text-bone/60 hover:text-bone/90'
      }`}
    >
      {children}
    </button>
  );
}
