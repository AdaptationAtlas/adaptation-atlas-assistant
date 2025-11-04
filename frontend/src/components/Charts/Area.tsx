import * as Plot from "@observablehq/plot";

import { Chart, type ChartProps } from "./Main";

export interface AreaChartProps extends Omit<ChartProps, "spec"> {
  xField: string;
  yField: string;
  categoryField: string;
  xLabel?: string;
  yLabel?: string;
  colorDomain?: string[];
  colorRange?: string[];
}

export const AreaChart = ({
  data,
  title,
  xField,
  yField,
  categoryField,
  className,
  xLabel,
  yLabel,
  colorDomain,
  colorRange,
}: AreaChartProps) => {
  const spec: ChartProps["spec"] = {
    marks: [
      Plot.areaY(data, {
        x: xField,
        y: yField,
        fill: categoryField,
      }),
    ],
    x: { label: xLabel, tickFormat: "d",   ticks: [2010, 2012, 2014, 2016, 2018, 2020] },
    y: { label: yLabel, grid: true },
    color: {
      domain: colorDomain,
      range: colorRange,
      legend: true,
    },
  };

  return <Chart data={data} title={title} className={className} spec={spec} />;
};
