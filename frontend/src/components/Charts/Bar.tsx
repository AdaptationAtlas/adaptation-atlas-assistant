import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { BarChartMetadata } from '../../types/generated';
import { Chart, type ChartProps, type ChartRef } from './Main';
import { Button } from '../Button';
import { formatValue } from '../../utils/stringFormatting';
import styles from './Bar.module.css';

export interface BarChartProps {
    data: unknown[];
    metadata: BarChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
    onFlippedChange?: (isFlipped: boolean) => void;
}

const truncateLabel = (label: string, maxLength = 15): string => {
    return label.length > maxLength ? label.slice(0, maxLength) + '...' : label;
};

export const BarChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
    onFlippedChange,
}: BarChartProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const chartRef = useRef<ChartRef>(null);

    const spec: ChartProps['spec'] = useMemo(() => {
        const categoryField = metadata.x_column;
        const valueField = metadata.y_column;
        const groupingField = metadata.grouping_column || categoryField;

        if (isFlipped) {
            return {
                marginBottom: 60,
                marginLeft: 120,
                x: {
                    label: valueField,
                    grid: true,
                    tickFormat: (d) => {
                        const value = typeof d === 'number' ? d : 0;
                        return formatValue(value);
                    },
                },
                y: {
                    label: categoryField,
                    tickFormat: (d) => truncateLabel(String(d)),
                },
                marks: [
                    Plot.barX(data, {
                        y: categoryField,
                        x: valueField,
                        fill: groupingField,
                    }),
                    Plot.tip(data, Plot.pointer({
                        x: valueField,
                        y: categoryField,
                        title: (d) => {
                            const item = d as Record<string, unknown>;
                            const xValue = String(item[categoryField]);
                            const rawYValue = item[valueField];
                            const yValue = typeof rawYValue === 'number'
                                ? formatValue(rawYValue)
                                : String(rawYValue);
                            return `${xValue}: ${yValue}`;
                        },
                    })),
                    Plot.ruleX([0]),
                ],
            };
        }

        return {
            marginBottom: 90,
            marginLeft: 60,
            x: {
                label: categoryField,
                tickRotate: -45,
                tickFormat: (d) => truncateLabel(String(d)),
            },
            y: {
                label: valueField,
                grid: true,
                tickFormat: (d) => {
                    const value = typeof d === 'number' ? d : 0;
                    return formatValue(value);
                },
            },
            marks: [
                Plot.barY(data, {
                    x: categoryField,
                    y: valueField,
                    fill: groupingField,
                }),
                Plot.tip(data, Plot.pointer({
                    x: categoryField,
                    y: valueField,
                    title: (d) => {
                        const item = d as Record<string, unknown>;
                        const xValue = String(item[categoryField]);
                        const rawYValue = item[valueField];
                        const yValue = typeof rawYValue === 'number'
                            ? formatValue(rawYValue)
                            : String(rawYValue);
                        return `${xValue}: ${yValue}`;
                    },
                })),
                Plot.ruleY([0]),
            ],
        };
    }, [data, isFlipped, metadata]);

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
