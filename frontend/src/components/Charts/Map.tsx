import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { Chart, type ChartProps, type ChartRef } from './Main';
import {
    formatValue,
    uppercaseFirstLetter,
} from '../../utils/stringFormatting';

import styles from './Map.module.css';

export interface MapChartMetadata {
    title: string;
    id_column: string;
    value_column: string;
    color_scheme?: string;
}

export interface MapChartProps {
    data: unknown[];
    metadata: MapChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
}

interface NationProperties {
    name: string;
    value?: number | null;
}

type NationsGeoJSON = FeatureCollection<Geometry, NationProperties>;

export const MapChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
}: MapChartProps) => {
    const [geoData, setGeoData] = useState<NationsGeoJSON | null>(null);
    const chartRef = useRef<ChartRef>(null);

    useEffect(() => {
        // sample geojson data selected & downloaded from: https://geojson-maps.kyd.au/
        // the data was also reduced to retain minimal properties
        fetch('/data/african-nations-reduced.geojson')
            .then((response) => response.json())
            .then((data) => setGeoData(data as NationsGeoJSON))
            .catch((error) => console.error('Error loading GeoJSON:', error));
    }, []);

    const spec: ChartProps['spec'] = useMemo(() => {
        if (!geoData) return { marks: [] };

        const idField = metadata.id_column;
        const valueField = metadata.value_column;
        const colorScheme = metadata.color_scheme || 'Oranges';

        const dataMap = new Map(
            data.map((item) => {
                const record = item as Record<string, unknown>;
                return [String(record[idField]), record[valueField]];
            })
        );

        // Enrich geojson data with sample query results
        const enrichedData: Feature<Geometry, NationProperties>[] =
            geoData.features.map((feature) => {
                // Use adm0_a3 property for country code matching (e.g., "MAR", "CMR", "NGA")
                const countryCode = (
                    feature.properties as Record<string, unknown>
                ).adm0_a3 as string;
                const value = dataMap.get(countryCode);
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: typeof value === 'number' ? value : null,
                    },
                } as Feature<Geometry, NationProperties>;
            });

        // Separate features into enriched and non-enriched to differentiate display
        const enrichedFeatures = enrichedData.filter(
            (f) => f.properties.value !== null
        );
        const nonenrichedFeatures = enrichedData.filter(
            (f) => f.properties.value === null
        );

        const marks: Plot.Markish[] = [
            Plot.geo(nonenrichedFeatures, {
                fill: '#E5E7EB', // gray background
                stroke: '#fff',
                strokeWidth: 1,
            }),
            Plot.geo(enrichedFeatures, {
                fill: (d) => d.properties.value,
                stroke: '#ddd',
                strokeWidth: 0.5,
            }),
            Plot.tip(
                enrichedFeatures,
                Plot.pointer(
                    Plot.geoCentroid({
                        title: (d) => {
                            const name = d.properties.name;
                            const value = d.properties.value;
                            if (value !== null && typeof value === 'number') {
                                return `${name}: ${formatValue(value)}`;
                            }
                            return '';
                        },
                    })
                )
            ),
        ];

        const domainFeatureCollection: FeatureCollection<
            Geometry,
            NationProperties
        > = {
            type: 'FeatureCollection',
            features: enrichedData,
        };

        return {
            height: 400,
            projection: {
                type: 'equirectangular',
                domain: domainFeatureCollection, // zoom to bounds
            },
            color: {
                //TODO: make "type" configurable to support different types of data distributions (ie chloropleth maps)
                // see sample: https://observablehq.com/@observablehq/plot-choropleth
                type: 'linear',
                scheme: colorScheme,
                legend: true,
                label: uppercaseFirstLetter(valueField),
            },
            marks,
        };
    }, [data, metadata, geoData]);

    // Notify parent when spec changes
    useEffect(() => {
        if (onSpecChange) {
            onSpecChange(spec);
        }
    }, [spec, onSpecChange]);

    useEffect(() => {
        if (onChartRefChange) {
            onChartRefChange(chartRef.current);
        }
    }, [onChartRefChange]);

    return (
        <div className={styles.chartWrapper}>
            <Chart
                ref={chartRef}
                data={data}
                spec={spec}
                title={metadata.title}
            />
        </div>
    );
};
