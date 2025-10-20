import { useState } from 'react';
import { ArrowUpIcon, XIcon, PaperclipIcon } from '../assets/icons';
import styles from './PromptBox.module.css';

interface PromptBoxProps {
  className?: string;
  onSubmit?: (value: string) => void;
  context?: { location?: string; crop?: string; files?: number };
}

export function PromptBox({ className = '', onSubmit, context }: PromptBoxProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    if (value.trim() && onSubmit) {
      onSubmit(value);
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContext = context && (context.location || context.crop || context.files);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={`${styles.promptBox} ${focused ? styles.focused : ''}`}>
        <textarea
          className={styles.input}
          placeholder="Ask a question..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyPress={handleKeyPress}
          rows={1}
        />

        <div className={styles.controls}>
          {hasContext && (
            <div className={styles.contextTags}>
              {context.location && (
                <div className={styles.tag}>
                  {context.location}
                  <button className={styles.tagClose} aria-label="Remove location">
                    <XIcon className={styles.tagIcon} />
                  </button>
                </div>
              )}
              {context.crop && (
                <div className={styles.tag}>
                  {context.crop}
                  <button className={styles.tagClose} aria-label="Remove crop">
                    <XIcon className={styles.tagIcon} />
                  </button>
                </div>
              )}
              {context.files && context.files > 0 && (
                <div className={styles.tag}>
                  <PaperclipIcon className={styles.attachIcon} />
                  {context.files}
                </div>
              )}
            </div>
          )}

          <button
            className={`${styles.submitBtn} ${!value.trim() ? styles.disabled : ''}`}
            onClick={handleSubmit}
            disabled={!value.trim()}
            aria-label="Submit prompt"
          >
            <ArrowUpIcon className={styles.submitIcon} />
          </button>
        </div>
      </div>

      <p className={styles.disclaimer}>
        AI can make mistakes. Please verify any outputs before using them in your work.
      </p>
    </div>
  );
}