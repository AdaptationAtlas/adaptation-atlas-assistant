import { useChatStore } from '../../store/chatStore';
import {
    CROP_LAYER_OPTIONS,
    LIVESTOCK_LAYER_OPTIONS,
    POPULATION_LAYER_OPTIONS,
    FARM_SIZES,
    EXPOSURE_RANGES,
} from '../../constants/sidebar';
import { Select } from '../Select';
import { Slider } from '../Slider';
import styles from '../SidebarSection.module.css';

export function ExposureSection() {
    const {
        sidebar,
        setExposureLayer,
        setExposureRange,
        setMaxFarmSize,
    } = useChatStore();

    const { crop, livestock, population, maxFarmSize } = sidebar.exposure;

    // Check if any crop or livestock layer is selected (for farm size visibility)
    const showFarmSize =
        crop.name !== 'None' || livestock.name !== 'None';

    return (
        <>
            {/* Crop Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Crop"
                    placeholder="Select crop"
                    options={[...CROP_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={crop.name}
                    onValueChange={(value: string) => setExposureLayer('crop', value)}
                />
                {crop.name !== 'None' && (
                    <Slider
                        label="Economic yield: $/ha"
                        isSingleHandle={false}
                        min={EXPOSURE_RANGES.crop.min}
                        max={EXPOSURE_RANGES.crop.max}
                        value={[
                            crop.rangeMin ?? EXPOSURE_RANGES.crop.min,
                            crop.rangeMax ?? EXPOSURE_RANGES.crop.max,
                        ]}
                        onValueChange={(values) =>
                            setExposureRange('crop', (values as [number, number])[0], (values as [number, number])[1])
                        }
                        minLabel={String(EXPOSURE_RANGES.crop.min)}
                        maxLabel={`>${EXPOSURE_RANGES.crop.max}`}
                    />
                )}
            </div>

            {/* Livestock Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Livestock"
                    placeholder="Select livestock"
                    options={[...LIVESTOCK_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={livestock.name}
                    onValueChange={(value: string) => setExposureLayer('livestock', value)}
                />
                {livestock.name !== 'None' && (
                    <Slider
                        label="Economic yield: $/km²"
                        isSingleHandle={false}
                        min={EXPOSURE_RANGES.livestock.min}
                        max={EXPOSURE_RANGES.livestock.max}
                        value={[
                            livestock.rangeMin ?? EXPOSURE_RANGES.livestock.min,
                            livestock.rangeMax ?? EXPOSURE_RANGES.livestock.max,
                        ]}
                        onValueChange={(values) =>
                            setExposureRange('livestock', (values as [number, number])[0], (values as [number, number])[1])
                        }
                        minLabel={String(EXPOSURE_RANGES.livestock.min)}
                        maxLabel={`>${EXPOSURE_RANGES.livestock.max / 1000}K`}
                    />
                )}
            </div>

            {/* Population Subsection */}
            <div className={styles.subsection}>
                <Select
                    label="Population"
                    placeholder="Select population type"
                    options={[...POPULATION_LAYER_OPTIONS].map((option) => ({
                        value: option,
                        label: option,
                    }))}
                    value={population.name}
                    onValueChange={(value: string) => setExposureLayer('population', value)}
                />
                {population.name !== 'None' && (
                    <Slider
                        label="Density: people/km²"
                        isSingleHandle={false}
                        min={EXPOSURE_RANGES.population.min}
                        max={EXPOSURE_RANGES.population.max}
                        value={[
                            population.rangeMin ?? EXPOSURE_RANGES.population.min,
                            population.rangeMax ?? EXPOSURE_RANGES.population.max,
                        ]}
                        onValueChange={(values) =>
                            setExposureRange('population', (values as [number, number])[0], (values as [number, number])[1])
                        }
                        minLabel={String(EXPOSURE_RANGES.population.min)}
                        maxLabel={`>${EXPOSURE_RANGES.population.max}`}
                    />
                )}
            </div>

            {/* Farm Size - only show if crop or livestock is selected */}
            {showFarmSize && (
                <div className={styles.subsection}>
                    <Slider
                        label="Farm Size (maximum ha)"
                        isSingleHandle={true}
                        steps={[...FARM_SIZES].map((size, index) => ({
                            value: index,
                            label: `0 to ${size.value}ha`,
                        }))}
                        value={FARM_SIZES.findIndex((s) => s.value === maxFarmSize)}
                        onValueChange={(value) => {
                            const farmSize = FARM_SIZES[value as number];
                            if (farmSize) {
                                setMaxFarmSize(farmSize.value);
                            }
                        }}
                    />
                </div>
            )}
        </>
    );
}
