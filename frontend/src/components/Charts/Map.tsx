import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import { Chart, type ChartProps, type ChartRef } from './Main';
import {
    formatValue,
    uppercaseFirstLetter,
} from '../../utils/stringFormatting';
import { MAP_GEO_CONFIGS, type AdminLevel } from './mapConfig';

import styles from './Map.module.css';

export interface MapChartMetadata {
    title: string;
    id_column: string;
    value_column: string;
    color_scheme?: string;
    admin_level?: AdminLevel;
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
    adm0_a3?: string;
    iso3?: string;
    admin0_name?: string;
    admin1_name?: string;
    admin2_name?: string;
    [key: string]: unknown;
}

type NationsGeoJSON = FeatureCollection<Geometry, NationProperties>;

const normalizeColorScheme = (scheme: string): Plot.ColorScheme => {
    return scheme.toLowerCase() as Plot.ColorScheme;
};

export const MapChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
}: MapChartProps) => {
    const [admin0GeoData, setAdmin0GeoData] = useState<NationsGeoJSON | null>(null);
    const [detailGeoData, setDetailGeoData] = useState<NationsGeoJSON | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const chartRef = useRef<ChartRef>(null);
    const detailChartRef = useRef<ChartRef>(null);

    const adminLevel = metadata.admin_level || 'admin0';
    const isAdmin0 = adminLevel === 'admin0';

    // Load geojson data based on admin level
    useEffect(() => {
        setIsLoading(true);

        if (isAdmin0) {
            const geoJsonPath = `${import.meta.env.BASE_URL}${MAP_GEO_CONFIGS.admin0.path.slice(1)}`;
            fetch(geoJsonPath)
                .then((response) => response.json())
                .then((data) => {
                    setAdmin0GeoData(data as NationsGeoJSON);
                    setDetailGeoData(null);
                })
                .catch((error) => console.error('Error loading GeoJSON:', error))
                .finally(() => setIsLoading(false));
        } else {
            const admin0Path = `${import.meta.env.BASE_URL}${MAP_GEO_CONFIGS.admin0.path.slice(1)}`;
            const detailPath = `${import.meta.env.BASE_URL}${MAP_GEO_CONFIGS[adminLevel].path.slice(1)}`;

            Promise.all([
                fetch(admin0Path).then((r) => r.json()),
                fetch(detailPath).then((r) => r.json()),
            ])
                .then(([admin0, detail]) => {
                    setAdmin0GeoData(admin0 as NationsGeoJSON);
                    setDetailGeoData(detail as NationsGeoJSON);
                })
                .catch((error) => console.error('Error loading GeoJSON:', error))
                .finally(() => setIsLoading(false));
        }
    }, [adminLevel, isAdmin0]);
    // Extract relevant country ISO3 codes and build data map
    const { relevantCountryISO3s, dataMap } = useMemo(() => {
        if (!detailGeoData || !data.length || isAdmin0) {
            return {
                relevantCountryISO3s: new Set<string>(),
                dataMap: new Map<string, number>(),
            };
        }

        const config = MAP_GEO_CONFIGS[adminLevel];
        const idField = metadata.id_column;
        const valueField = metadata.value_column;

        const dataMapLocal = new Map<string, number>();
        const dataIds = new Set<string>();

        data.forEach((item) => {
            const record = item as Record<string, unknown>;
            const id = record[idField];

            // Skip null/undefined/empty IDs - these are aggregate rows
            if (id == null || id === '') {
                return;
            }

            const idStr = String(id);
            const value = record[valueField];
            dataIds.add(idStr);
            if (typeof value === 'number') {
                dataMapLocal.set(idStr, value);
            }
        });

        // Filter geojson features to only those matching API data
        const filtered = detailGeoData.features.filter((feature) => {
            const featureId = String(
                (feature.properties as Record<string, unknown>)[config.idProperty]
            );
            return dataIds.has(featureId);
        });

        const iso3s = new Set<string>();
        filtered.forEach((f) => {
            const iso3 = f.properties?.iso3;
            if (iso3) {
                iso3s.add(iso3 as string);
            }
        });


        return {
            relevantCountryISO3s: iso3s,
            dataMap: dataMapLocal,
        };
    }, [detailGeoData, data, metadata, adminLevel, isAdmin0]);

    // Admin0 spec (single panel - existing behavior)
    const admin0Spec: ChartProps['spec'] = useMemo(() => {
        if (!admin0GeoData || !isAdmin0) return { marks: [] };

        const idField = metadata.id_column;
        const valueField = metadata.value_column;
        const colorScheme = (metadata.color_scheme || 'Oranges') as Plot.ColorScheme;

        const dataMapLocal = new Map(
            data.map((item) => {
                const record = item as Record<string, unknown>;
                return [String(record[idField]), record[valueField]];
            })
        );

        // Enrich geojson data with sample query results
        const enrichedData: Feature<Geometry, NationProperties>[] =
            admin0GeoData.features.map((feature: Feature<Geometry, NationProperties>) => {
                const countryCode = (
                    feature.properties as Record<string, unknown>
                ).adm0_a3 as string;
                const value = dataMapLocal.get(countryCode);
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: typeof value === 'number' ? value : null,
                    },
                } as Feature<Geometry, NationProperties>;
            });

        const enrichedFeatures = enrichedData.filter(
            (f) => f.properties.value !== null
        );
        const nonenrichedFeatures = enrichedData.filter(
            (f) => f.properties.value === null
        );

        const marks: Plot.Markish[] = [
            Plot.geo(nonenrichedFeatures, {
                fill: '#E5E7EB',
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
                domain: domainFeatureCollection,
            },
            color: {
                type: 'linear',
                scheme: colorScheme,
                legend: true,
                label: uppercaseFirstLetter(valueField),
                tickFormat: formatValue,
            },
            marks,
        };
    }, [data, metadata, admin0GeoData, isAdmin0]);

    // Country outline spec for left panel in split view - shows all Africa with relevant countries highlighted
    const countryOutlineSpec: ChartProps['spec'] = useMemo(() => {
        if (!admin0GeoData || isAdmin0) {
            return { marks: [] };
        }

        const highlightedCountries = admin0GeoData.features.filter((f) =>
            relevantCountryISO3s.has(f.properties?.adm0_a3 as string)
        );
        const backgroundCountries = admin0GeoData.features.filter((f) =>
            !relevantCountryISO3s.has(f.properties?.adm0_a3 as string)
        );

        const featureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
            type: 'FeatureCollection',
            features: admin0GeoData.features,
        };

        return {
            height: 100,
            width: 140,
            projection: {
                type: 'equirectangular',
                domain: featureCollection,
            },
            style: {
                background: 'transparent',
            },
            marks: [
                Plot.geo(backgroundCountries, {
                    fill: '#E5E7EB',
                    stroke: '#D1D5DB',
                    strokeWidth: 0.3,
                }),
                Plot.geo(highlightedCountries, {
                    fill: '#1d5022',
                    stroke: '#16A34A',
                    strokeWidth: 1,
                }),
                Plot.tip(
                    highlightedCountries,
                    Plot.pointer(
                        Plot.geoCentroid({
                            title: (d) => d.properties?.name || 'Unknown',
                        })
                    )
                ),
            ],
        };
    }, [admin0GeoData, relevantCountryISO3s, isAdmin0]);

    // Detail spec for admin1/admin2 right panel using Observable Plot
    const detailSpec: ChartProps['spec'] = useMemo(() => {

        if (!detailGeoData || isAdmin0 || relevantCountryISO3s.size === 0) {
            return { marks: [] };
        }

        const config = MAP_GEO_CONFIGS[adminLevel];
        const colorScheme = normalizeColorScheme(metadata.color_scheme || 'Oranges');

        // Filter to all admin1/admin2 features from parent countries
        const parentFeatures = detailGeoData.features.filter((f) =>
            relevantCountryISO3s.has(f.properties?.iso3 as string)
        );


        if (parentFeatures.length === 0) {
            console.log('[Map] detailSpec - returning empty marks (no parent features)');
            return { marks: [] };
        }

        // Enrich features with value and hasData flag
        const enrichedFeatures = parentFeatures.map((f) => {
            const featureId = String(
                (f.properties as Record<string, unknown>)[config.idProperty]
            );
            return {
                ...f,
                properties: {
                    ...f.properties,
                    value: dataMap.get(featureId) ?? null,
                    hasData: dataMap.has(featureId),
                },
            };
        });

        const enrichedGeo: FeatureCollection<Geometry, NationProperties> = {
            type: 'FeatureCollection',
            features: enrichedFeatures,
        };

        // Calculate value domain from data
        const values = Array.from(dataMap.values());
        const minVal = values.length > 0 ? Math.min(...values) : 0;
        const maxVal = values.length > 0 ? Math.max(...values) : 1;

        // Split features into with/without data
        const featuresWithData = enrichedFeatures.filter((f) => f.properties?.hasData);
        const featuresWithoutData = enrichedFeatures.filter((f) => !f.properties?.hasData);


        const marks: Plot.Markish[] = [
            Plot.geo(
                { type: 'FeatureCollection', features: featuresWithoutData },
                {
                    fill: '#e5e5e5',
                    stroke: '#999',
                    strokeWidth: 0.3,
                }
            ),
            Plot.geo(
                { type: 'FeatureCollection', features: featuresWithData },
                {
                    fill: (d) => (d as Feature<Geometry, NationProperties>).properties?.value ?? 0,
                    stroke: '#333',
                    strokeWidth: 0.5,
                }
            ),
            Plot.tip(
                enrichedFeatures,
                Plot.pointer(
                    Plot.centroid({
                        title: (d) => {
                            const name = (d.properties as Record<string, unknown>)[
                                config.nameProperty
                            ] as string;
                            const val = d.properties?.value;
                            if (val !== null && typeof val === 'number') {
                                return `${name}: ${formatValue(val)}`;
                            }
                            return name || 'Unknown';
                        },
                    })
                )
            ),
        ];

        return {
            height: 400,
            projection: {
                type: 'reflect-y',
                domain: enrichedGeo,
                clip: false,
            },
            color: {
                type: 'linear',
                scheme: colorScheme,
                domain: [minVal, maxVal],
                legend: true,
                label: uppercaseFirstLetter(metadata.value_column),
                tickFormat: formatValue,
            },
            marks,
        };
    }, [detailGeoData, dataMap, relevantCountryISO3s, metadata, adminLevel, isAdmin0]);

    // Notify parent when spec changes (for admin0)
    useEffect(() => {
        if (onSpecChange && isAdmin0) {
            onSpecChange(admin0Spec);
        }
    }, [admin0Spec, onSpecChange, isAdmin0]);

    useEffect(() => {
        if (onChartRefChange) {
            // Pass the appropriate ref based on admin level
            const ref = isAdmin0 ? chartRef.current : detailChartRef.current;
            onChartRefChange(ref);
        }
    }, [onChartRefChange, isAdmin0, admin0Spec, detailSpec]);

    if (isLoading) {
        return (
            <div className={styles.chartWrapper}>
                <div className={styles.loading}>Loading map data...</div>
            </div>
        );
    }

    // Admin0 - single panel
    if (isAdmin0) {
        return (
            <div className={styles.chartWrapper}>
                <Chart
                    ref={chartRef}
                    data={data}
                    spec={admin0Spec}
                    title={metadata.title}
                />
            </div>
        );
    }

    // Admin1/Admin2 - detail view with inset
    return (
        <div className={styles.chartWrapper}>
            <h3 className={styles.title}>{metadata.title}</h3>
            <div className={styles.detailViewContainer}>
                {/* Country context inset */}
                <div className={styles.countryContextInset}>
                    <Chart data={[{}]} spec={countryOutlineSpec} />
                </div>
                {/* Main detail panel */}
                <div className={styles.detailPanel}>
                    <Chart ref={detailChartRef} data={[{}]} spec={detailSpec} />
                </div>
            </div>
        </div>
    );
};
