import { useChatStore } from '../../store/chatStore';
import {
    ADAPTIVE_CAPACITY_LAYER_OPTIONS,
    ADAPTIVE_CAPACITY_LABELS,
    ADAPTIVE_CAPACITY_RANGES,
} from '../../constants/sidebar';
import { Select } from '../Select';
import { Slider } from '../Slider';

export function AdaptiveCapacitySection() {
    const {
        sidebar,
        setAdaptiveCapacityLayer,
        setAdaptiveCapacityRange,
    } = useChatStore();

    const { name, rangeMin, rangeMax } = sidebar.adaptiveCapacity;

    const currentRange = ADAPTIVE_CAPACITY_RANGES[name];
    const currentLabel = ADAPTIVE_CAPACITY_LABELS[name] || 'Value Range';

    return (
        <>
            <Select
                label="Select"
                placeholder="Select indicator"
                options={[...ADAPTIVE_CAPACITY_LAYER_OPTIONS].map((option) => ({
                    value: option,
                    label: option,
                }))}
                value={name}
                onValueChange={(value: string) => setAdaptiveCapacityLayer(value)}
            />

            {name !== 'None' && currentRange && (
                <Slider
                    label={currentLabel}
                    min={currentRange.min}
                    max={currentRange.max}
                    step={currentRange.step}
                    value={[
                        rangeMin ?? currentRange.min,
                        rangeMax ?? currentRange.max,
                    ]}
                    onValueChange={(values: [number, number]) =>
                        setAdaptiveCapacityRange(values[0], values[1])
                    }
                    minLabel={String(currentRange.min)}
                    maxLabel={`>${currentRange.max}`}
                />
            )}
        </>
    );
}
