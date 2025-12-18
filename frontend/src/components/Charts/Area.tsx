import { useMemo, useState, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { AreaChartMetadata } from '../../types/generated';
import { Chart, type ChartProps, type ChartRef } from './Main';
import { Button } from '../Button';
import { formatValue } from '../../utils/stringFormatting';
import styles from './Area.module.css';

export interface AreaChartProps {
    data: unknown[];
    metadata: AreaChartMetadata;
    onSpecChange?: (spec: ChartProps['spec']) => void;
    onChartRefChange?: (ref: ChartRef | null) => void;
    onFlippedChange?: (isFlipped: boolean) => void;
}

export const AreaChart = ({
    data,
    metadata,
    onSpecChange,
    onChartRefChange,
    onFlippedChange,
}: AreaChartProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const chartRef = useRef<ChartRef>(null);

    const spec: ChartProps['spec'] = useMemo(() => {
        const xField = metadata.x_column;
        const yField = metadata.y_column;
        const groupingField = metadata.grouping_column;

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
                    Plot.areaX(data, {
                        y: xField,
                        x: yField,
                        fill: groupingField || 'steelblue',
                        fillOpacity: 0.6,
                        tip: true,
                    }),
                    Plot.ruleX([0]),
                ],
            };
        }

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
                Plot.areaY(data, {
                    x: xField,
                    y: yField,
                    fill: groupingField || 'steelblue',
                    fillOpacity: 0.6,
                    tip: true,
                }),
                Plot.ruleY([0]),
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
