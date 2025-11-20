import { useChatStore } from '../../store/chatStore';
import { REGIONS, COUNTRIES } from '../../constants/sidebar';
import type { Geography } from '../../types/sidebar';
import { Combobox } from '../Combobox';

export function GeographySection() {
    const { sidebar, setGeography } = useChatStore();

    // Combine regions and countries into a single options array
    const options = [
        ...REGIONS.map((region) => ({
            value: `region:${region}`,
            label: region,
            group: 'Region',
        })),
        ...COUNTRIES.map((country) => ({
            value: `country:${country.gadml0}`,
            label: country.name,
            group: 'Country',
        })),
    ];

    // Convert selected geographies to combobox values
    const selectedValues = sidebar.geography.selected.map((geo) =>
        geo.group === 'Region' ? `region:${geo.label}` : `country:${geo.label}`,
    );

    const handleChange = (values: string[]) => {
        // Convert combobox values back to Geography objects
        const geographies: Geography[] = values.map((value) => {
            const [group, label] = value.split(':');
            return {
                group: group === 'region' ? 'Region' : 'Country',
                label,
            } as Geography;
        });

        setGeography(geographies);
    };

    return (
        <Combobox
            label="Region or Country"
            placeholder="Search regions or countries..."
            options={options}
            value={selectedValues}
            onChange={handleChange}
        />
    );
}
