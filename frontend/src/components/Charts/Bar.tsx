import * as Plot from '@observablehq/plot';
import type { BarChartMetadata } from '../../types/generated';
import { Chart, type ChartProps } from './Main';

export interface BarChartProps {
    data: unknown[];
    metadata: BarChartMetadata;
}

const truncateLabel = (label: string, maxLength = 15): string => {
    return label.length > maxLength ? label.slice(0, maxLength) + '...' : label;
};

const formatValue = (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
};

export const BarChart = ({ data, metadata }: BarChartProps) => {
    const spec: ChartProps['spec'] = {
        marginBottom: 90,
        marginLeft: 60,
        x: {
            label: metadata.x_column,
            tickRotate: -45,
            tickFormat: (d) => truncateLabel(String(d)),
        },
        y: {
            label: metadata.y_column,
            grid: true,
            tickFormat: (d) => {
                const value = typeof d === 'number' ? d : 0;
                return formatValue(value);
            },
        },
        marks: [
            Plot.barY(data, {
                x: metadata.x_column,
                y: metadata.y_column,
                fill: metadata.grouping_column || metadata.x_column,
            }),
            Plot.tip(data, Plot.pointer({
                x: metadata.x_column,
                y: metadata.y_column,
                title: (d) => {
                    const item = d as Record<string, unknown>;
                    const xValue = String(item[metadata.x_column]);
                    const rawYValue = item[metadata.y_column];
                    const yValue = typeof rawYValue === 'number'
                        ? formatValue(rawYValue)
                        : String(rawYValue);
                    return `${xValue}: ${yValue}`;
                },
            })),
            Plot.ruleY([0]),
        ],
    };

    return <Chart data={data} spec={spec} title={metadata.title} />;
};
