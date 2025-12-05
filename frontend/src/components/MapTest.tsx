import { MapChart, type MapChartMetadata } from './Charts/Map';
import styles from './MapTest.module.css';
import { COUNTRIES } from '../constants/sidebar';

// Enhance first 10 countries with sample climate impact values
const sampleData = COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(
    (country, index) => ({
        ...country,
        value: index < 10 ? (index + 1) * 200000 : undefined, // 200K, 400K, 600K, 800K, 1M
    })
);

const metadata: MapChartMetadata = {
    title: 'Sample Climate Impact by Nation',
    id_column: 'gadml0',
    value_column: 'value',
    color_scheme: 'Greens',
};

export function MapTest() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Map Chart</h1>
                <p>
                    Testing the Observable Plot map component with sample data
                </p>
            </div>
            <div className={styles.chartContainer}>
                <MapChart data={sampleData} metadata={metadata} />
            </div>
            <div className={styles.info}>
                <h2>Test Data</h2>
                <p>
                    The map shows sample climate data for{' '}
                    {
                        sampleData.filter(
                            (country) => country.value !== undefined
                        ).length
                    }{' '}
                    African nations.
                </p>
            </div>
        </div>
    );
}
