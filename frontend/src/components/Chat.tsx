import { useState } from 'react';
import { PromptBuilderSidebar } from './PromptBuilderSidebar';
import { EmptyState } from './EmptyState';
import { PromptBox } from './PromptBox';
import AtlasLogo from '../assets/atlas-a.svg';
import styles from './Chat.module.css';

const examplePrompts = [
  "How is maize production projected to change under future climate scenarios in Kenya?",
  "Which regions in West Africa face the highest exposure to drought risk?",
  "Compare adaptive capacity between smallholder farmers in Malawi and Zambia"
];

const sidebarSections = [
  { id: 'geography', label: 'GEOGRAPHY', expanded: false },
  { id: 'hazards', label: 'CLIMATE HAZARDS', expanded: false },
  { id: 'exposure', label: 'EXPOSURE', expanded: false },
  { id: 'capacity', label: 'ADAPTIVE CAPACITY', expanded: false },
  { id: 'attachments', label: 'ATTACHMENTS', expanded: false }
];

export function Chat() {
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [selectedContext] = useState<{
    location?: string;
    crop?: string;
    files?: number;
  }>({});

  const handlePromptSubmit = (value: string) => {
    console.log('Prompt submitted:', value);
    // Handle prompt submission
  };

  const handleExampleClick = (prompt: string) => {
    console.log('Example prompt clicked:', prompt);
    // Handle example prompt
  };

  const toggleSection = (sectionId: string) => {
    setActiveSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white">
      {/* Left gradient sidebar */}
      <div className={styles.leftBar}>
        <div className={styles.logoContainer}>
          <img src={AtlasLogo} alt="Atlas Logo" className={styles.logo} />
        </div>
        <div className={styles.userAvatar}>
          <span>B</span>
        </div>
      </div>

      {/* Prompt Builder Sidebar */}
      <PromptBuilderSidebar
        sections={sidebarSections}
        activeSections={activeSections}
        onToggleSection={toggleSection}
      />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <EmptyState
          examplePrompts={examplePrompts}
          onExampleClick={handleExampleClick}
        />

        <div className={styles.promptContainer}>
          <PromptBox
            onSubmit={handlePromptSubmit}
            context={selectedContext}
          />
        </div>
      </main>
    </div>
  );
}
