import { HeroSection } from './HeroSection';
import { ExamplePrompts } from './ExamplePrompts';
import { Acknowledgements } from './Acknowledgements';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    onExampleClick: (prompt: string) => void;
    className?: string;
}

export function EmptyState({ onExampleClick, className }: EmptyStateProps) {
    return (
        <div className={`${styles.emptyState} ${className || ''}`}>
            <HeroSection
                title="Welcome to the Africa Agriculture Adaptation Atlas Assistant!"
                description="Discover how climate change will affect agriculture across Africa and explore data-driven solutions to support adaptation strategies."
            />

            <ExamplePrompts onExampleClick={onExampleClick} />

            <Acknowledgements />
        </div>
    );
}
