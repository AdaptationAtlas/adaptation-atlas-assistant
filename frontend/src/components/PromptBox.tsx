import { useState } from 'react';
import { ArrowUpIcon } from '../assets/icons';
import { Pill } from './Pill';
import styles from './PromptBox.module.css';
import type { PromptContextTag } from '../types/sidebar';

interface PromptBoxProps {
    className?: string;
    onSubmit?: (value: string) => void;
    context?: PromptContextTag[];
    onRemoveTag?: (tagId: string) => void;
}

export function PromptBox({
    className = '',
    onSubmit,
    context,
    onRemoveTag,
}: PromptBoxProps) {
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

    const hasContext = context && context.length > 0;

    return (
        <div className={`${styles.container} ${className}`}>
            <div
                className={`${styles.promptBox} ${focused ? styles.focused : ''}`}
            >
                <textarea
                    className={styles.input}
                    placeholder="Ask a question..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyUp={handleKeyPress}
                    rows={3}
                />

                <div className={styles.controls}>
                    {hasContext && (
                        <div className={styles.contextTags}>
                            {context.map((tag: PromptContextTag) => (
                                <Pill
                                    key={tag.id}
                                    onRemove={onRemoveTag ? () => onRemoveTag(tag.id) : undefined}
                                >
                                    {tag.label}
                                </Pill>
                            ))}
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
                AI can make mistakes. Please verify any outputs before using
                them in your work.
            </p>
        </div>
    );
}
