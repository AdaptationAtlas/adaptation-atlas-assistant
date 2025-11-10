import * as Plot from '@observablehq/plot';

import { Chart, type ChartProps } from './Main';

export interface BarChartProps extends Omit<ChartProps, 'spec'> {
    xField: string;
    categoryField: string;
    colorDomain: string[];
    colorRange: string[];
    textColor?: string;
}

export const BarChart = ({
    data,
    title,
    xField,
    categoryField,
    hasLegend,
    colorDomain,
    colorRange,
    textColor,
}: BarChartProps) => {
    type DataItem = Record<string, number | string>;
    const typedData = data as DataItem[];

    const spec: ChartProps['spec'] = {
        height: 40,
        // marginTop: 40,
        x: {
            axis: null,
            domain: [0, 100],
        },
        y: {
            axis: null,
        },
        color: {
            domain: colorDomain,
            range: colorRange,
            legend: hasLegend,
        },
        marks: [
            // Stacked bar
            Plot.barX(typedData, { x: xField, fill: categoryField }),
            // Text labels
            Plot.text(typedData, {
                x: (d, i) => {
                    // Calculate cumulative position for text placement
                    let cumulative = 0;
                    for (let j = 0; j < i; j++) {
                        cumulative += typedData[j][xField] as number;
                    }
                    return cumulative + (d[xField] as number) / 2;
                },
                text: (d) => `${d[xField]}%`,
                fill: textColor ?? 'black',
                fontSize: 14,
                fontWeight: '500',
            }),
        ],
    };

    return <Chart data={data} title={title} spec={spec} />;
};
