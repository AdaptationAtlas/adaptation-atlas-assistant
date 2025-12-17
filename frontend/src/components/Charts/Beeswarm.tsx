import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { BeeswarmChartMetadata } from '../../types/generated';
import { Chart, type ChartProps, type ChartRef } from './Main';
import { Button } from '../Button';
import { formatValue } from '../../utils/stringFormatting';
import styles from './Beeswarm.module.css';

export interface BeeswarmChartProps {
    data: unknown[];
    metadata: BeeswarmChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
    onFlippedChange?: (isFlipped: boolean) => void;
}

export const BeeswarmChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
    onFlippedChange,
}: BeeswarmChartProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const chartRef = useRef<ChartRef>(null);

    const spec: ChartProps['spec'] = useMemo(() => {
        const categoryField = metadata.category_column;
        const valueField = metadata.value_column;
        const colorField = metadata.color_column || categoryField;

        // Flipped view: swap x and y axes
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
                fy: {
                    label: categoryField,
                },
                color: colorField ? { legend: true } : undefined,
                marks: [
                    Plot.dot(data, Plot.dodgeY({
                        x: valueField,
                        fy: categoryField,
                        fill: colorField,
                        r: 3,
                    })),
                    Plot.tip(data, Plot.pointer(Plot.dodgeY({
                        x: valueField,
                        fy: categoryField,
                        title: (d) => {
                            const item = d as Record<string, unknown>;
                            const categoryValue = String(item[categoryField]);
                            const rawValue = item[valueField];
                            const value = typeof rawValue === 'number'
                                ? formatValue(rawValue)
                                : String(rawValue);
                            return `${categoryValue}: ${value}`;
                        },
                    }))),
                ],
            };
        }

        // Normal view: category on x, value on y
        return {
            marginBottom: 90,
            marginLeft: 60,
            fx: {
                label: categoryField,
                tickRotate: -45,
            },
            y: {
                label: valueField,
                grid: true,
                tickFormat: (d) => {
                    const value = typeof d === 'number' ? d : 0;
                    return formatValue(value);
                },
            },
            color: colorField ? { legend: true } : undefined,
            marks: [
                Plot.dot(data, Plot.dodgeX({
                    fx: categoryField,
                    y: valueField,
                    fill: colorField,
                    r: 3,
                })),
                Plot.tip(data, Plot.pointer(Plot.dodgeX({
                    fx: categoryField,
                    y: valueField,
                    title: (d) => {
                        const item = d as Record<string, unknown>;
                        const categoryValue = String(item[categoryField]);
                        const rawValue = item[valueField];
                        const value = typeof rawValue === 'number'
                            ? formatValue(rawValue)
                            : String(rawValue);
                        return `${categoryValue}: ${value}`;
                    },
                }))),
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
