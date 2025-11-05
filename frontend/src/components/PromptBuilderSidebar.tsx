import { SidebarSection } from './SidebarSection';
import styles from './PromptBuilderSidebar.module.css';

interface SidebarSectionData {
    id: string;
    label: string;
    expanded: boolean;
}

interface PromptBuilderSidebarProps {
    sections: SidebarSectionData[];
    activeSections: string[];
    onToggleSection: (sectionId: string) => void;
    className?: string;
}

export function PromptBuilderSidebar({
    sections,
    activeSections,
    onToggleSection,
    className,
}: PromptBuilderSidebarProps) {
    return (
        <div className={`${styles.sidebar} ${className || ''}`}>
            <div className={styles.sidebarPanel}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}>PROMPT BUILDER</span>
                </div>

                <div className={styles.sidebarContent}>
                    <div className={styles.sidebarDivider} />

                    {sections.map((section) => (
                        <SidebarSection
                            key={section.id}
                            section={section}
                            isActive={activeSections.includes(section.id)}
                            onToggle={() => onToggleSection(section.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
