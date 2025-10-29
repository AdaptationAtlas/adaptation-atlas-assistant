import { useState } from 'react';
import { PromptBox } from './PromptBox';
import {
  CaretRightIcon,
  MagicWandIcon
} from '../assets/icons';
import AtlasLogo from '../assets/atlas-a.svg';
import styles from './Welcome.module.css';

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

export function Welcome() {
  const [activeSections, setActiveSections] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedContext, setSelectedContext] = useState<{
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
      <div className={styles.sidebar}>
        <div className={styles.sidebarPanel}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>PROMPT BUILDER</span>
          </div>

          <div className={styles.sidebarContent}>
            <div className={styles.sidebarDivider} />

            {sidebarSections.map(section => (
              <div key={section.id}>
                <button
                  className={styles.sidebarSection}
                  onClick={() => toggleSection(section.id)}
                >
                  <CaretRightIcon
                    className={`${styles.caretIcon} ${
                      activeSections.includes(section.id) ? styles.expanded : ''
                    }`}
                  />
                  <span className={styles.sectionLabel}>{section.label}</span>
                </button>
                <div className={styles.sidebarDivider} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroImage}>
            <div className={styles.heroCircle}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  Welcome to the Africa Agriculture Adaptation Atlas Assistant!
                </h1>
                <p className={styles.heroDescription}>
                  Discover how climate change will affect agriculture across Africa and
                  explore data-driven solutions to support adaptation strategies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className={styles.examplesSection}>
          <div className={styles.examplesDivider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>Try asking about…</span>
            <div className={styles.dividerLine} />
          </div>

          <div className={styles.examplesList}>
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                className={styles.examplePrompt}
                onClick={() => handleExampleClick(prompt)}
              >
                <MagicWandIcon className={styles.exampleIcon} />
                <span className={styles.exampleText}>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
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
