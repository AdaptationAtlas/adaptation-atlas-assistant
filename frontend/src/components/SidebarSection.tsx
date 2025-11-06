import { CaretRightIcon } from '../assets/icons';
import styles from './SidebarSection.module.css';

interface SidebarSectionProps {
    section: {
        id: string;
        label: string;
        expanded: boolean;
    };
    isActive: boolean;
    onToggle: () => void;
}

export function SidebarSection({
    section,
    isActive,
    onToggle,
}: SidebarSectionProps) {
    return (
        <div>
            <button className={styles.sidebarSection} onClick={onToggle}>
                <CaretRightIcon
                    className={`${styles.caretIcon} ${isActive ? styles.expanded : ''}`}
                />
                <span className={styles.sectionLabel}>{section.label}</span>
            </button>
            <div className={styles.sidebarDivider} />
        </div>
    );
}
