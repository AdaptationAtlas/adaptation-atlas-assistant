import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { LineChartMetadata } from '../../types/generated';
import { Chart, type ChartProps, type ChartRef } from './Main';
import { Button } from '../Button';
import { formatValue } from '../../utils/stringFormatting';
import styles from './Line.module.css';

export interface LineChartProps {
    data: unknown[];
    metadata: LineChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
    onFlippedChange?: (isFlipped: boolean) => void;
}

export const LineChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
    onFlippedChange,
}: LineChartProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const chartRef = useRef<ChartRef>(null);

    const spec: ChartProps['spec'] = useMemo(() => {
        const xField = metadata.x_column;
        const yField = metadata.y_column;
        const groupingField = metadata.grouping_column;

        // Flipped view: swap x and y axes
        if (isFlipped) {
            return {
                marginBottom: 60,
                marginLeft: 120,
                x: {
                    label: yField,
                    grid: true,
                    tickFormat: (d) => {
                        const value = typeof d === 'number' ? d : 0;
                        return formatValue(value);
                    },
                },
                y: {
                    label: xField,
                },
                color: groupingField ? { legend: true } : undefined,
                marks: [
                    Plot.lineX(data, {
                        y: xField,
                        x: yField,
                        stroke: groupingField || 'steelblue',
                        strokeWidth: 2,
                    }),
                    Plot.dot(data, {
                        y: xField,
                        x: yField,
                        fill: groupingField || 'steelblue',
                    }),
                    Plot.tip(data, Plot.pointer({
                        y: xField,
                        x: yField,
                        title: (d) => {
                            const item = d as Record<string, unknown>;
                            const xValue = String(item[xField]);
                            const rawYValue = item[yField];
                            const yValue = typeof rawYValue === 'number'
                                ? formatValue(rawYValue)
                                : String(rawYValue);
                            return `${xValue}: ${yValue}`;
                        },
                    })),
                ],
            };
        }

        // Normal view
        return {
            marginBottom: 60,
            marginLeft: 60,
            x: {
                label: xField,
            },
            y: {
                label: yField,
                grid: true,
                tickFormat: (d) => {
                    const value = typeof d === 'number' ? d : 0;
                    return formatValue(value);
                },
            },
            color: groupingField ? { legend: true } : undefined,
            marks: [
                Plot.lineY(data, {
                    x: xField,
                    y: yField,
                    stroke: groupingField || 'steelblue',
                    strokeWidth: 2,
                }),
                Plot.dot(data, {
                    x: xField,
                    y: yField,
                    fill: groupingField || 'steelblue',
                }),
                Plot.tip(data, Plot.pointer({
                    x: xField,
                    y: yField,
                    title: (d) => {
                        const item = d as Record<string, unknown>;
                        const xValue = String(item[xField]);
                        const rawYValue = item[yField];
                        const yValue = typeof rawYValue === 'number'
                            ? formatValue(rawYValue)
                            : String(rawYValue);
                        return `${xValue}: ${yValue}`;
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
