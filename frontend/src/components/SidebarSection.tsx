import { CaretRightIcon } from '../assets/icons';
import styles from './SidebarSection.module.css';
import { Select } from './Select';
import { SearchInput } from './SearchInput';
import { Slider } from './Slider';
import { SliderWithSteps } from './SliderWithSteps';
import { TwoButtonToggle } from './TwoButtonToggle';
import { ThreeButtonToggle } from './ThreeButtonToggle';
import { Button } from './Button';
import { Pill } from './Pill';

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
            {isActive && (
                <div className={styles.content}>
                    <Pill icon={<span>🇺🇸</span>} onRemove={() => {}}>pill</Pill>
                    <Select
                        label="Label"
                        placeholder="Select an option"
                        options={[
                            { value: 'option1', label: 'Option 1' },
                            { value: 'option2', label: 'Option 2' },
                            { value: 'option3', label: 'Option 3' },
                        ]}
                    />
                    <SearchInput
                        placeholder="Which regions in West Africa face the highest exposure to drought risk?"
                    />
                    <Slider
                        label="Density: people/km²"
                        min={0}
                        max={45}
                        defaultValue={[0, 45]}
                        minLabel="0"
                        maxLabel=">45"
                    />
                    <SliderWithSteps
                        label="Farm Size (maximum ha):"
                        steps={[
                            { value: 0, label: '0 to 2' },
                            { value: 1, label: '0 to 5' },
                            { value: 2, label: '0 to 10' },
                            { value: 3, label: '0 to 20' },
                        ]}
                        defaultValue={[0, 3]}
                    />
                    <TwoButtonToggle
                        label="Under scenario"
                        options={[
                            { value: 'rcp45', label: 'RCP 4.5' },
                            { value: 'rcp85', label: 'RCP 8.5' },
                        ]}
                        defaultValue="rcp45"
                    />
                    <ThreeButtonToggle
                        label="Over period"
                        options={[
                            { value: 'baseline', label: 'Baseline' },
                            { value: '2030', label: '2030' },
                            { value: '2050', label: '2050' },
                        ]}
                        defaultValue="baseline"
                    />
                    <Button>Generate</Button>
                </div>
            )}
            <div className={styles.sidebarDivider} />
        </div>
    );
}
