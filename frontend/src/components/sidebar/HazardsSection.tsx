import { useChatStore } from '../../store/chatStore';
import {
    HEAT_LAYER_OPTIONS,
    DROUGHT_LAYER_OPTIONS,
    FLOOD_LAYER_OPTIONS,
    SEVERITY_MARKS,
    TIME_PERIODS,
    SCENARIOS,
} from '../../constants/sidebar';
import { Select } from '../Select';
import { Slider } from '../Slider';
import { TwoButtonToggle } from '../TwoButtonToggle';
import { ThreeButtonToggle } from '../ThreeButtonToggle';
import styles from '../SidebarSection.module.css';

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
                        min={1}
                        max={4}
                        value={[heat.severityMin, heat.severityMax]}
                        onValueChange={(values: [number, number]) =>
                            setHazardSeverity('heat', values[0], values[1])
                        }
                        minLabel={
                            SEVERITY_MARKS.find((m) => m.value === 1)?.label ||
                            'None'
                        }
                        maxLabel={
                            SEVERITY_MARKS.find((m) => m.value === 4)?.label ||
                            'Extreme'
                        }
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
                        min={1}
                        max={4}
                        value={[drought.severityMin, drought.severityMax]}
                        onValueChange={(values: [number, number]) =>
                            setHazardSeverity('drought', values[0], values[1])
                        }
                        minLabel={
                            SEVERITY_MARKS.find((m) => m.value === 1)?.label ||
                            'None'
                        }
                        maxLabel={
                            SEVERITY_MARKS.find((m) => m.value === 4)?.label ||
                            'Extreme'
                        }
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
                        min={1}
                        max={4}
                        value={[flood.severityMin, flood.severityMax]}
                        onValueChange={(values: [number, number]) =>
                            setHazardSeverity('flood', values[0], values[1])
                        }
                        minLabel={
                            SEVERITY_MARKS.find((m) => m.value === 1)?.label ||
                            'None'
                        }
                        maxLabel={
                            SEVERITY_MARKS.find((m) => m.value === 4)?.label ||
                            'Extreme'
                        }
                    />
                )}

                {/* Time Period Selection - using 3 periods for ThreeButtonToggle */}
                <ThreeButtonToggle
                    label="Over Period"
                    options={[
                        { value: String(TIME_PERIODS[0].value), label: TIME_PERIODS[0].label },
                        { value: String(TIME_PERIODS[2].value), label: TIME_PERIODS[2].label },
                        { value: String(TIME_PERIODS[4].value), label: TIME_PERIODS[4].label },
                    ]}
                    value={String(year)}
                    onValueChange={(value: string) => setYear(Number(value))}
                />

                {/* Scenario Selection - only show if year is not 2000, using 2 scenarios for TwoButtonToggle */}
                {year !== 2000 && (
                    <TwoButtonToggle
                        label="Under Scenario"
                        options={[
                            { value: SCENARIOS[0].value, label: SCENARIOS[0].label },
                            { value: SCENARIOS[2].value, label: SCENARIOS[2].label },
                        ]}
                        value={scenario}
                        onValueChange={(value: string) => setScenario(value)}
                    />
                )}
            </div>
        </>
    );
}
