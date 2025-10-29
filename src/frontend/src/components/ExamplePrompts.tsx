import { MagicWandIcon } from '../assets/icons';
import styles from './ExamplePrompts.module.css';

interface ExamplePromptsProps {
  prompts: string[];
  onExampleClick: (prompt: string) => void;
  className?: string;
}

export function ExamplePrompts({ prompts, onExampleClick, className }: ExamplePromptsProps) {
  return (
    <div className={`${styles.examplesSection} ${className || ''}`}>
      <div className={styles.examplesDivider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Try asking about…</span>
        <div className={styles.dividerLine} />
      </div>

      <div className={styles.examplesList}>
        {prompts.map((prompt, index) => (
          <button
            key={index}
            className={styles.examplePrompt}
            onClick={() => onExampleClick(prompt)}
          >
            <MagicWandIcon className={styles.exampleIcon} />
            <span className={styles.exampleText}>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
