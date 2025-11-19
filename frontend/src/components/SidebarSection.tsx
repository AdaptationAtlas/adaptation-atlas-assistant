import { CaretRightIcon } from '../assets/icons';
import styles from './SidebarSection.module.css';
import { Select } from './Select';
import { Slider } from './Slider';
import { SliderWithSteps } from './SliderWithSteps';
import { TwoButtonToggle } from './TwoButtonToggle';
import { ThreeButtonToggle } from './ThreeButtonToggle';
import { Combobox } from './Combobox';

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
                return renderGeographySection();
            case 'climate':
                return renderClimateSection();
            case 'exposure':
                return renderExposureSection();
            case 'capacity':
                return renderAdaptiveCapacitySection();
            case 'attachments':
                return null;
            default:
                return null;
        }
    };

    const renderGeographySection = () => (
        <>
            <Combobox
                label="Region or Country"
                placeholder="Search regions or countries..."
                options={[
                    { value: 'ssa', label: 'Sub-Saharan Africa' },
                    { value: 'ca', label: 'Central Africa' },
                    { value: 'wa', label: 'West Africa' },
                    { value: 'ea', label: 'East Africa' },
                    { value: 'sa', label: 'Southern Africa' },
                ]}
                defaultValue={['ssa', 'ca']}
            />
        </>
    );

    const renderClimateSection = () => (
        <>
            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Heat</h4>
                <Select
                    label="Heat"
                    placeholder="Select heat indicator"
                    options={[
                        {
                            value: 'heat-stress-generic',
                            label: 'Heat Stress Generic Crop',
                        },
                    ]}
                    value="heat-stress-generic"
                />
                <Slider
                    label="Stress Level"
                    min={1}
                    max={4}
                    defaultValue={[1, 4]}
                    minLabel="None"
                    maxLabel="Extreme"
                />
            </div>

            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Drought</h4>
                <Select
                    label="Drought"
                    placeholder="Select drought indicator"
                    options={[
                        {
                            value: 'thornthwaite-aridity',
                            label: "Thornthwaite's Aridity Index",
                        },
                    ]}
                    value="thornthwaite-aridity"
                />
                <Slider
                    label="Stress Level"
                    min={1}
                    max={4}
                    defaultValue={[1, 4]}
                    minLabel="None"
                    maxLabel="Extreme"
                />
            </div>

            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Flooding</h4>
                <Select
                    label="Flooding"
                    placeholder="Select flooding indicator"
                    options={[{ value: 'waterlogging', label: 'Waterlogging' }]}
                    value="waterlogging"
                />
                <Slider
                    label="Stress Level"
                    min={1}
                    max={4}
                    defaultValue={[1, 4]}
                    minLabel="None"
                    maxLabel="Extreme"
                />
                <ThreeButtonToggle
                    label="Over Period"
                    options={[
                        { value: 'baseline', label: 'Baseline' },
                        { value: '2030', label: '2030' },
                        { value: '2050', label: '2050' },
                    ]}
                    defaultValue="2050"
                />
                <TwoButtonToggle
                    label="Under Scenario"
                    options={[
                        { value: 'rcp45', label: 'RCP 4.5' },
                        { value: 'rcp85', label: 'RCP 8.5' },
                    ]}
                    defaultValue="rcp85"
                />
            </div>
        </>
    );

    const renderExposureSection = () => (
        <>
            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Crop</h4>
                <Select
                    label="Crop"
                    placeholder="Select crop"
                    options={[
                        {
                            value: 'banana-plantain',
                            label: 'Banana and Plantain',
                        },
                    ]}
                    value="banana-plantain"
                />
                <Slider
                    label="Economic yield: $/ha"
                    min={70}
                    max={962}
                    defaultValue={[70, 962]}
                    minLabel="70"
                    maxLabel=">962"
                />
            </div>

            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Livestock</h4>
                <Select
                    label="Livestock"
                    placeholder="Select livestock"
                    options={[{ value: 'cattle', label: 'Cattle' }]}
                    value="cattle"
                />
                <Slider
                    label="Economic yield: $/km²"
                    min={0}
                    max={5900}
                    defaultValue={[0, 5900]}
                    minLabel="0"
                    maxLabel=">5.9K"
                />
            </div>

            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Population</h4>
                <Select
                    label="Population"
                    placeholder="Select population type"
                    options={[{ value: 'rural', label: 'Rural Population' }]}
                    value="rural"
                />
                <Slider
                    label="Density: people/km²"
                    min={0}
                    max={45}
                    defaultValue={[0, 45]}
                    minLabel="0"
                    maxLabel=">45"
                />
            </div>

            <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Farm Size</h4>
                <SliderWithSteps
                    label="Farm Size (maximum ha)"
                    steps={[
                        { value: 0, label: '0 to 2ha' },
                        { value: 1, label: '0 to 5ha' },
                        { value: 2, label: '0 to 10ha' },
                        { value: 3, label: '0 to 20ha' },
                    ]}
                    defaultValue={[0, 0]}
                />
            </div>
        </>
    );

    const renderAdaptiveCapacitySection = () => (
        <>
            <Select
                label="Select"
                placeholder="Select indicator"
                options={[{ value: 'banking', label: 'Banking Access' }]}
                value="banking"
            />
            <Slider
                label="Proportion of Households with a Bank Account (0-1)"
                min={0}
                max={0.9}
                step={0.1}
                defaultValue={[0, 0.9]}
                minLabel="0"
                maxLabel=">0.9"
            />
        </>
    );

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
