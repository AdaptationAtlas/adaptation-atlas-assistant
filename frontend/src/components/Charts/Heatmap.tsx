import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { HeatmapChartMetadata } from '../../types/generated';
import { Chart, type ChartProps, type ChartRef } from './Main';
import { Button } from '../Button';
import { formatValue } from '../../utils/stringFormatting';
import styles from './Heatmap.module.css';

export interface HeatmapChartProps {
    data: unknown[];
    metadata: HeatmapChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
    onFlippedChange?: (isFlipped: boolean) => void;
}

export const HeatmapChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
    onFlippedChange,
}: HeatmapChartProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const chartRef = useRef<ChartRef>(null);

    const spec: ChartProps['spec'] = useMemo(() => {
        const xField = metadata.x_column;
        const yField = metadata.y_column;
        const valueField = metadata.value_column;
        const colorScheme = (metadata.color_scheme || 'YlOrRd') as Plot.ColorScheme;

        // Flipped view: swap x and y axes
        if (isFlipped) {
            return {
                marginBottom: 60,
                marginLeft: 120,
                x: {
                    label: yField,
                },
                y: {
                    label: xField,
                },
                color: {
                    type: 'linear',
                    scheme: colorScheme,
                    legend: true,
                    label: valueField,
                    tickFormat: formatValue,
                },
                marks: [
                    Plot.cell(data, {
                        x: yField,
                        y: xField,
                        fill: valueField,
                    }),
                    Plot.tip(data, Plot.pointer({
                        x: yField,
                        y: xField,
                        title: (d) => {
                            const item = d as Record<string, unknown>;
                            const xValue = String(item[yField]);
                            const yValue = String(item[xField]);
                            const rawValue = item[valueField];
                            const formattedValue = typeof rawValue === 'number'
                                ? formatValue(rawValue)
                                : String(rawValue);
                            return `${xValue}, ${yValue}: ${formattedValue}`;
                        },
                    })),
                ],
            };
        }

        // Normal view
        return {
            marginBottom: 90,
            marginLeft: 60,
            x: {
                label: xField,
                tickRotate: -45,
            },
            y: {
                label: yField,
            },
            color: {
                type: 'linear',
                scheme: colorScheme,
                legend: true,
                label: valueField,
                tickFormat: formatValue,
            },
            marks: [
                Plot.cell(data, {
                    x: xField,
                    y: yField,
                    fill: valueField,
                }),
                Plot.tip(data, Plot.pointer({
                    x: xField,
                    y: yField,
                    title: (d) => {
                        const item = d as Record<string, unknown>;
                        const xValue = String(item[xField]);
                        const yValue = String(item[yField]);
                        const rawValue = item[valueField];
                        const formattedValue = typeof rawValue === 'number'
                            ? formatValue(rawValue)
                            : String(rawValue);
                        return `${xValue}, ${yValue}: ${formattedValue}`;
                    },
                })),
            ],
        };
    }, [data, isFlipped, metadata]);

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

    useEffect(() => {
        if (onFlippedChange) {
            onFlippedChange(isFlipped);
        }
    }, [isFlipped, onFlippedChange]);

    return (
        <div className={styles.chartWrapper}>
            <div className={styles.toolbar}>
                <Button
                    variant="outline"
                    onClick={() => setIsFlipped((prev) => !prev)}
                >
                    Flip axes
                </Button>
            </div>
            <Chart ref={chartRef} data={data} spec={spec} title={metadata.title} />
        </div>
    );
};
