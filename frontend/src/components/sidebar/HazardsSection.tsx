import { useChatStore } from '../../store/chatStore';
import {
    HEAT_LAYER_OPTIONS,
    DROUGHT_LAYER_OPTIONS,
    FLOOD_LAYER_OPTIONS,
    SEVERITY_MARKS,
    TIME_PERIODS,
    SCENARIOS,
} from '../../constants/sidebar';
import type { SeverityLevel } from '../../types/sidebar';
import type { Step } from '../Slider';
import { Select } from '../Select';
import { Slider } from '../Slider';
import { ButtonToggle } from '../ButtonToggle';
import styles from '../SidebarSection.module.css';

// Convert readonly SEVERITY_MARKS to mutable Step[] for Slider component
const SEVERITY_STEPS: Step[] = [...SEVERITY_MARKS];

// Helper to convert severity string to numeric value for slider
const severityToNumber = (severity: SeverityLevel): number => {
    const mark = SEVERITY_MARKS.find(m => m.label === severity);
    return mark?.value ?? 1;
};

// Helper to convert numeric slider value to severity string
const numberToSeverity = (value: number): SeverityLevel => {
    const mark = SEVERITY_MARKS.find(m => m.value === value);
    return (mark?.label ?? 'None') as SeverityLevel;
};

export function HazardsSection() {
    const {
        sidebar,
        setHazardLayer,
        setHazardSeverity,
        setYear,
        setScenario,
    } = useChatStore();

    const { heat, drought, flood, year, scenario } = sidebar.hazards;

    return (
        <>
            {/* Heat Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Heat"
                    placeholder="Select heat indicator"
                    options={[...HEAT_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={heat.name}
                    onValueChange={(value: string) => setHazardLayer('heat', value)}
                />
                {heat.name !== 'None' && (
                    <Slider
                        label="Stress Level"
                        isSingleHandle={false}
                        steps={SEVERITY_STEPS}
                        value={[severityToNumber(heat.severityMin), severityToNumber(heat.severityMax)]}
                        onValueChange={(values) => {
                            const [min, max] = values as [number, number];
                            setHazardSeverity('heat', numberToSeverity(min), numberToSeverity(max));
                        }}
                    />
                )}
            </div>

            {/* Drought Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Drought"
                    placeholder="Select drought indicator"
                    options={[...DROUGHT_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={drought.name}
                    onValueChange={(value: string) => setHazardLayer('drought', value)}
                />
                {drought.name !== 'None' && (
                    <Slider
                        label="Stress Level"
                        isSingleHandle={false}
                        steps={SEVERITY_STEPS}
                        value={[severityToNumber(drought.severityMin), severityToNumber(drought.severityMax)]}
                        onValueChange={(values) => {
                            const [min, max] = values as [number, number];
                            setHazardSeverity('drought', numberToSeverity(min), numberToSeverity(max));
                        }}
                    />
                )}
            </div>

            {/* Flooding Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Flooding"
                    placeholder="Select flooding indicator"
                    options={[...FLOOD_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={flood.name}
                    onValueChange={(value: string) => setHazardLayer('flood', value)}
                />
                {flood.name !== 'None' && (
                    <Slider
                        label="Stress Level"
                        isSingleHandle={false}
                        steps={SEVERITY_STEPS}
                        value={[severityToNumber(flood.severityMin), severityToNumber(flood.severityMax)]}
                        onValueChange={(values) => {
                            const [min, max] = values as [number, number];
                            setHazardSeverity('flood', numberToSeverity(min), numberToSeverity(max));
                        }}
                    />
                )}

                {/* Time Period Selection */}
                <ButtonToggle
                    label="Over Period"
                    options={[
                        { value: String(TIME_PERIODS[0].value), label: TIME_PERIODS[0].label },
                        { value: String(TIME_PERIODS[2].value), label: TIME_PERIODS[2].label },
                        { value: String(TIME_PERIODS[4].value), label: TIME_PERIODS[4].label },
                    ]}
                    value={String(year)}
                    onValueChange={(value: string) => setYear(Number(value))}
                />

                {/* Scenario Selection - only show if year is not 2000 */}
                <ButtonToggle
                    isDisabled={year === 2000}
                    label="Under Scenario"
                    options={[
                        { value: SCENARIOS[0].value, label: SCENARIOS[0].label },
                        { value: SCENARIOS[2].value, label: SCENARIOS[2].label },
                    ]}
                    value={scenario}
                    onValueChange={(value: string) => setScenario(value)}
                />
            </div>
        </>
    );
}
