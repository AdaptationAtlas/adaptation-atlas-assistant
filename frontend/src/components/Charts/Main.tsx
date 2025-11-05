import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import styles from './Main.module.css';

export interface ChartProps {
    data: unknown[];
    spec: Plot.PlotOptions & { mark?: string };
    title?: string;
    hasLegend?: boolean;
    className?: string;
}

// To add a new chart, reference the main gallery
// https://observablehq.com/@observablehq/plot-gallery
export function Chart({ data, spec, title, className }: ChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !data || data.length === 0) return;

        try {
            // Create the plot with the provided spec
            const plot = Plot.plot({
                ...spec,
                width: containerRef.current.clientWidth,
                height: spec.height || 400,
            });

            // Clear previous content and append new plot
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(plot);
        } catch (error) {
            console.error('Error rendering chart:', error);
            if (containerRef.current) {
                containerRef.current.innerHTML =
                    '<p className={styles.error}>Error rendering chart</p>';
            }
        }

        // Cleanup function
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [data, spec]);

    return (
        <div className={`${styles.chartContainer} ${className || ''}`}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={styles.chart} ref={containerRef} />
        </div>
    );
}
