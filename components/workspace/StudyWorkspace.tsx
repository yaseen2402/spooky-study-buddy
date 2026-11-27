'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { FeynmanMode } from './FeynmanMode';
import { SessionNotes } from './SessionNotes';

type Tab = 'notes' | 'feynman';
const ORDER: Tab[] = ['notes', 'feynman'];
const LABEL: Record<Tab, string> = { notes: 'Notes', feynman: 'Explain to Ghost' };

export function StudyWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ notes: null, feynman: null });

  // WAI-ARIA tabs: arrow keys / Home / End move between tabs.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = ORDER.indexOf(activeTab);
    let next: Tab | null = null;
    if (e.key === 'ArrowRight') next = ORDER[(i + 1) % ORDER.length];
    if (e.key === 'ArrowLeft') next = ORDER[(i - 1 + ORDER.length) % ORDER.length];
    if (e.key === 'Home') next = ORDER[0];
    if (e.key === 'End') next = ORDER[ORDER.length - 1];
    if (next) {
      e.preventDefault();
      setActiveTab(next);
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <section className="study-workspace" aria-label="Study workspace">
      <div className="workspace-tabs" role="tablist" aria-label="Study workspace" onKeyDown={onKeyDown}>
        {ORDER.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            id={`tab-${tab}`}
            type="button"
            role="tab"
            className="tab-btn"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
          >
            {LABEL[tab]}
          </button>
        ))}
      </div>

      <div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" className="tab-panel" hidden={activeTab !== 'notes'}>
        <SessionNotes />
      </div>
      <div id="panel-feynman" role="tabpanel" aria-labelledby="tab-feynman" className="tab-panel" hidden={activeTab !== 'feynman'}>
        <FeynmanMode />
      </div>
    </section>
  );
}
