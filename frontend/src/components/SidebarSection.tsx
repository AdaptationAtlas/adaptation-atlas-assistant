import { CaretRightIcon } from '../assets/icons';
import styles from './SidebarSection.module.css';
import { GeographySection } from './sidebar/GeographySection';
import { HazardsSection } from './sidebar/HazardsSection';
import { ExposureSection } from './sidebar/ExposureSection';
import { AdaptiveCapacitySection } from './sidebar/AdaptiveCapacitySection';
import { AttachmentsSection } from './sidebar/AttachmentsSection';

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
    const renderSectionContent = () => {
        switch (section.id) {
            case 'geography':
                return <GeographySection />;
            case 'hazards':
                return <HazardsSection />;
            case 'exposure':
                return <ExposureSection />;
            case 'capacity':
                return <AdaptiveCapacitySection />;
            case 'attachments':
                return <AttachmentsSection />;
            default:
                return null;
        }
    };

    return (
        <div>
            <button className={styles.sidebarSection} onClick={onToggle}>
                <CaretRightIcon
                    className={`${styles.caretIcon} ${isActive ? styles.expanded : ''}`}
                />
                <span className={styles.sectionLabel}>{section.label}</span>
            </button>
            {isActive && (
                <div className={styles.content}>{renderSectionContent()}</div>
            )}
            <div className={styles.sidebarDivider} />
        </div>
    );
}
