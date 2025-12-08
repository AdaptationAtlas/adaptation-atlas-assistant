import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as Plot from '@observablehq/plot';
import styles from './Main.module.css';

export interface ChartProps {
    data: unknown[];
    spec: Plot.PlotOptions & { mark?: string };
    title?: string;
    hasLegend?: boolean;
    className?: string;
}

export interface ChartRef {
    getSvgElement: () => SVGElement | null;
}

// To add a new chart, reference the main gallery
// https://observablehq.com/@observablehq/plot-gallery
export const Chart = forwardRef<ChartRef, ChartProps>(function Chart(
    { data, spec, title, className },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        getSvgElement: () => {
            const container = containerRef.current;
            if (!container) return null;

            const figure = container.querySelector('figure');
            if (!figure) return container.querySelector('svg');

            const svgs = figure.querySelectorAll<SVGSVGElement>(':scope > svg');
            if (svgs.length === 0) return null;
            if (svgs.length === 1) return svgs[0];

            // Multiple SVGs (e.g., legend + chart) - combine them into one
            const combinedSvg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            let currentY = 0;
            let maxWidth = 0;

            svgs.forEach((svg) => {
                const clone = svg.cloneNode(true) as SVGElement;
                const width = parseFloat(svg.getAttribute('width') || '0');
                const height = parseFloat(svg.getAttribute('height') || '0');

                const g = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'g'
                );
                g.setAttribute('transform', `translate(0, ${currentY})`);

                while (clone.firstChild) {
                    g.appendChild(clone.firstChild);
                }
                combinedSvg.appendChild(g);

                currentY += height + 10; // 10px gap between elements
                maxWidth = Math.max(maxWidth, width);
            });

            combinedSvg.setAttribute('width', String(maxWidth));
            combinedSvg.setAttribute('height', String(currentY));
            combinedSvg.setAttribute('viewBox', `0 0 ${maxWidth} ${currentY}`);
            combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            return combinedSvg;
        },
    }));

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !data || data.length === 0) return;

        try {
            // Create the plot with the provided spec
            const plot = Plot.plot({
                ...spec,
                width: container.clientWidth,
                height: spec.height || 400,
            });

            // Clear previous content and append new plot
            container.innerHTML = '';
            container.appendChild(plot);
        } catch (error) {
            console.error('Error rendering chart:', error);
            if (container) {
                container.innerHTML =
                    '<p className={styles.error}>Error rendering chart</p>';
            }
        }

        // Cleanup function
        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [data, spec]);

    return (
        <div className={`${styles.chartContainer} ${className || ''}`}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={styles.chart} ref={containerRef} />
        </div>
    );
});
