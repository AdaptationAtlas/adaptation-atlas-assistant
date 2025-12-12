import { useState, useCallback, useMemo } from 'react';
import { MagicWandIcon } from '../assets/icons';
import { Button } from './Button';
import { getRandomPrompts, type Prompt } from '../data/prompts';
import styles from './ExamplePrompts.module.css';

interface ExamplePromptsProps {
    prompts?: string[];
    onExampleClick: (prompt: string) => void;
    className?: string;
    count?: number;
    showRefresh?: boolean;
}

export function ExamplePrompts({
    prompts: providedPrompts,
    onExampleClick,
    className,
    count = 3,
    showRefresh = true,
}: ExamplePromptsProps) {
    const [randomPrompts, setRandomPrompts] = useState<Prompt[]>(() =>
        providedPrompts ? [] : getRandomPrompts(count)
    );

    const handleRefresh = useCallback(() => {
        setRandomPrompts(getRandomPrompts(count));
    }, [count]);

    const displayPrompts = useMemo(() => {
        if (providedPrompts) {
            return providedPrompts.map((text, index) => ({
                id: `provided-${index}`,
                text,
                category: 'Suggestions',
            }));
        }
        return randomPrompts;
    }, [providedPrompts, randomPrompts]);

    const shouldShowRefresh = !providedPrompts && showRefresh;

    return (
        <div className={`${styles.examplesSection} ${className || ''}`}>
            <div className={styles.examplesDivider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>
                    {providedPrompts ? 'You might also ask...' : 'Try asking about...'}
                </span>
                {shouldShowRefresh && (
                    <button
                        className={styles.refreshButton}
                        onClick={handleRefresh}
                        aria-label="Refresh example prompts"
                        title="Show different examples"
                    >
                        <RefreshIcon className={styles.refreshIcon} />
                    </button>
                )}
                <div className={styles.dividerLine} />
            </div>

            <div className={styles.examplesList}>
                {displayPrompts.map((prompt) => (
                    <Button
                        key={prompt.id}
                        onClick={() => onExampleClick(prompt.text)}
                        icon={<MagicWandIcon />}
                        hoverSlide={true}
                        italic={true}
                        align="left"
                    >
                        {prompt.text}
                    </Button>
                ))}
            </div>
        </div>
    );
}

const RefreshIcon = ({ className = '' }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M21 3V7.5H16.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
