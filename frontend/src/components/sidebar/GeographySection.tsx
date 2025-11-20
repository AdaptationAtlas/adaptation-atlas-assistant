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
    const selectedValues = sidebar.geography.selected.map((geo) => {
        if (geo.group === 'Region') {
            return `region:${geo.label}`;
        } else {
            // For countries, find the gadml0 code by country name
            const country = COUNTRIES.find(c => c.name === geo.label);
            return `country:${country?.gadml0 || geo.label}`;
        }
    });

    const handleChange = (values: string[]) => {
        // Convert combobox values back to Geography objects
        const geographies: Geography[] = values.map((value) => {
            const [group, code] = value.split(':');

            if (group === 'region') {
                return {
                    group: 'Region',
                    label: code, // For regions, code is the region name
                } as Geography;
            } else {
                // For countries, look up the country name by gadml0 code
                const country = COUNTRIES.find(c => c.gadml0 === code);
                return {
                    group: 'Country',
                    label: country?.name || code, // Use country name, fallback to code
                } as Geography;
            }
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
