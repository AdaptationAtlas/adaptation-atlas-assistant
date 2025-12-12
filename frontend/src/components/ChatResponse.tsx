import { useState, useCallback } from 'react';
import { AreaChart } from './Charts/Area';
import { BarChart } from './Charts/Bar';
import { MapChart } from './Charts/Map';
import type { ChartRef } from './Charts/Main';
import type {
    AiResponseMessage,
    AreaChartMetadata,
    BarChartMetadata,
    GenerateChartMetadataResponseMessage,
    MapChartMetadata,
    OutputResponseMessage,
} from '../types/generated';
import { ExamplePrompts } from './ExamplePrompts';
import type { StreamEvent, ChatStatus } from '../types/chat';
import { Button } from './Button';
import styles from './ChatResponse.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, CheckIcon, CodeIcon, DownloadIcon } from '../assets/icons';
import { copyToClipboard } from '../utils/clipboard';

interface ChatResponseProps {
    events: StreamEvent[];
    status: ChatStatus;
    onSuggestionClick?: (query: string) => void;
}

function isAiMessage(event: StreamEvent | null): event is AiResponseMessage & { id?: string; timestamp?: number } {
    if (!event) return false;
    if ('error' in event) return false;
    return event.type === 'ai';
}

function isGenerateChartMetadataMessage(event: StreamEvent): event is GenerateChartMetadataResponseMessage & { id?: string; timestamp?: number } {
    if (!event || 'error' in event) return false;
    return event.type === 'tool' && 'name' in event && event.name === 'generate_chart_metadata';
}

function isOutputMessage(event: StreamEvent | null): event is OutputResponseMessage & { id?: string; timestamp?: number } {
    if (!event) return false;
    if ('error' in event) return false;
    return event.type === 'output';
}

function isOutputToolEvent(event: StreamEvent): boolean {
    if (!event || 'error' in event) return false;
    return event.type === 'tool' && 'name' in event && event.name?.toLowerCase() === 'output';
}

const markdownComponents = {
    pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => {
        return (
            <div className={styles.codeBlock}>
                <pre {...props}>{children}</pre>
            </div>
        );
    },
    code: ({ children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
        return <code className={styles.inlineCode} {...props}>{children}</code>;
    },
    table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => {
        return <table className={styles.table} {...props}>{children}</table>;
    },
    thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => {
        return <thead className={styles.thead} {...props}>{children}</thead>;
    },
    tbody: ({ children, ...props }: React.ComponentPropsWithoutRef<'tbody'>) => {
        return <tbody className={styles.tbody} {...props}>{children}</tbody>;
    },
    tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => {
        return <tr className={styles.tr} {...props}>{children}</tr>;
    },
    th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => {
        return <th className={styles.th} {...props}>{children}</th>;
    },
    td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => {
        return <td className={styles.td} {...props}>{children}</td>;
    },
    ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => {
        return <ul className={styles.ul} {...props}>{children}</ul>;
    },
    ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => {
        return <ol className={styles.ol} {...props}>{children}</ol>;
    },
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => {
        return <li className={styles.li} {...props}>{children}</li>;
    },
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => {
        return <p className={styles.p} {...props}>{children}</p>;
    }
};

interface CopyButtonProps {
    content: string;
    className?: string;
}

function CopyButton({ content }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleCopy}
            icon={copied ? <CheckIcon /> : <CopyIcon />}
        >
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
}

interface GetCodeButtonProps {
    metadata: BarChartMetadata;
    data: unknown[];
    isFlipped: boolean;
}

function generateObservableCode(metadata: BarChartMetadata, data: unknown[], isFlipped: boolean): string {
    const { x_column, y_column, grouping_column, title } = metadata;
    const fill = grouping_column || x_column;
    const dataJson = JSON.stringify(data, null, 2);

    if (isFlipped) {
        return `// Data
data = ${dataJson}

// Chart: ${title || 'Bar Chart'}
Plot.plot({
  marginBottom: 60,
  marginLeft: 120,
  x: {
    label: "${y_column}",
    grid: true,
  },
  y: {
    label: "${x_column}",
  },
  marks: [
    Plot.barX(data, {
      y: "${x_column}",
      x: "${y_column}",
      fill: "${fill}",
    }),
    Plot.ruleX([0]),
  ]
})`;
    }

    return `// Data
data = ${dataJson}

// Chart: ${title || 'Bar Chart'}
Plot.plot({
  marginBottom: 90,
  marginLeft: 60,
  x: {
    label: "${x_column}",
    tickRotate: -45,
  },
  y: {
    label: "${y_column}",
    grid: true,
  },
  marks: [
    Plot.barY(data, {
      x: "${x_column}",
      y: "${y_column}",
      fill: "${fill}",
    }),
    Plot.ruleY([0]),
  ]
})`;
}

function GetCodeButton({ metadata, data, isFlipped }: GetCodeButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const code = generateObservableCode(metadata, data, isFlipped);
        const success = await copyToClipboard(code);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleCopy}
            icon={copied ? <CheckIcon /> : <CodeIcon />}
        >
            {copied ? 'Copied' : 'Get Code'}
        </Button>
    );
}

function generateMapObservableCode(
    metadata: MapChartMetadata,
    data: unknown[]
): string {
    const { id_column, value_column, color_scheme, title } = metadata;
    const dataJson = JSON.stringify(data, null, 2);

    return `// Data
data = ${dataJson}

// GeoJSON (fetch African nations)
geoData = await fetch('/data/african-nations-reduced.geojson').then(r => r.json())

// Enrich GeoJSON with data values
dataMap = new Map(data.map(d => [d["${id_column}"], d["${value_column}"]]))
enrichedFeatures = geoData.features.map(f => ({
  ...f,
  properties: { ...f.properties, value: dataMap.get(f.properties.adm0_a3) ?? null }
}))

// Chart: ${title || 'Choropleth Map'}
Plot.plot({
  height: 400,
  projection: {
    type: "equirectangular",
    domain: { type: "FeatureCollection", features: enrichedFeatures },
  },
  color: {
    type: "linear",
    scheme: "${color_scheme || 'Oranges'}",
    legend: true,
    label: "${value_column}",
  },
  marks: [
    Plot.geo(enrichedFeatures.filter(f => f.properties.value === null), {
      fill: "#E5E7EB",
      stroke: "#fff",
      strokeWidth: 1,
    }),
    Plot.geo(enrichedFeatures.filter(f => f.properties.value !== null), {
      fill: d => d.properties.value,
      stroke: "#ddd",
      strokeWidth: 0.5,
    }),
    Plot.tip(
      enrichedFeatures.filter(f => f.properties.value !== null),
      Plot.pointer(Plot.geoCentroid({
        title: d => \`\${d.properties.name}: \${d.properties.value}\`
      }))
    ),
  ]
})`;
}

interface GetMapCodeButtonProps {
    metadata: MapChartMetadata;
    data: unknown[];
}

function GetMapCodeButton({ metadata, data }: GetMapCodeButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const code = generateMapObservableCode(metadata, data);
        const success = await copyToClipboard(code);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleCopy}
            icon={copied ? <CheckIcon /> : <CodeIcon />}
        >
            {copied ? 'Copied' : 'Get Code'}
        </Button>
    );
}

function generateAreaObservableCode(
    metadata: AreaChartMetadata,
    data: unknown[]
): string {
    const { x_column, y_column, grouping_column, title } = metadata;
    const dataJson = JSON.stringify(data, null, 2);

    return `// Data
data = ${dataJson}

// Chart: ${title || 'Area Chart'}
Plot.plot({
  marginBottom: 60,
  marginLeft: 60,
  x: { label: "${x_column}" },
  y: { label: "${y_column}", grid: true },
  marks: [
    Plot.areaY(data, {
      x: "${x_column}",
      y: "${y_column}",
      fill: ${grouping_column ? `"${grouping_column}"` : '"steelblue"'},
      fillOpacity: 0.6,
    }),
    Plot.lineY(data, {
      x: "${x_column}",
      y: "${y_column}",
      stroke: ${grouping_column ? `"${grouping_column}"` : '"steelblue"'},
      strokeWidth: 1.5,
    }),
    Plot.ruleY([0]),
  ]
})`;
}

interface GetAreaCodeButtonProps {
    metadata: AreaChartMetadata;
    data: unknown[];
}

function GetAreaCodeButton({ metadata, data }: GetAreaCodeButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const code = generateAreaObservableCode(metadata, data);
        const success = await copyToClipboard(code);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleCopy}
            icon={copied ? <CheckIcon /> : <CodeIcon />}
        >
            {copied ? 'Copied' : 'Get Code'}
        </Button>
    );
}

interface DownloadButtonProps {
    chartRef: ChartRef | null;
    title?: string;
}

function DownloadButton({ chartRef, title }: DownloadButtonProps) {
    const handleDownload = () => {
        if (!chartRef) return;

        const svg = chartRef.getSvgElement();
        if (!svg) return;

        const clonedSvg = svg.cloneNode(true) as SVGElement;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.svg` : 'chart.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Button variant="outline" onClick={handleDownload} icon={<DownloadIcon />}>
            Download
        </Button>
    );
}

interface ArtifactWithControlsProps {
    data: unknown[];
    metadata: BarChartMetadata;
    rawData: string;
}

function ArtifactWithControls({ data, metadata, rawData }: ArtifactWithControlsProps) {
    const [chartRef, setChartRef] = useState<ChartRef | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleChartRefChange = useCallback((ref: ChartRef | null) => {
        setChartRef(ref);
    }, []);

    const handleFlippedChange = useCallback((flipped: boolean) => {
        setIsFlipped(flipped);
    }, []);

    return (
        <div className={styles.artifact}>
            <BarChart
                data={data}
                metadata={metadata}
                onChartRefChange={handleChartRefChange}
                onFlippedChange={handleFlippedChange}
            />
            <div className={styles.copyRow}>
                <CopyButton content={rawData} />
                <DownloadButton chartRef={chartRef} title={metadata.title} />
                <GetCodeButton metadata={metadata} data={data} isFlipped={isFlipped} />
            </div>
        </div>
    );
}

interface MapArtifactWithControlsProps {
    data: unknown[];
    metadata: MapChartMetadata;
    rawData: string;
}

function MapArtifactWithControls({ data, metadata, rawData }: MapArtifactWithControlsProps) {
    const [chartRef, setChartRef] = useState<ChartRef | null>(null);

    const handleChartRefChange = useCallback((ref: ChartRef | null) => {
        setChartRef(ref);
    }, []);

    return (
        <div className={styles.artifact}>
            <MapChart
                data={data}
                metadata={metadata}
                onChartRefChange={handleChartRefChange}
            />
            <div className={styles.copyRow}>
                <CopyButton content={rawData} />
                <DownloadButton chartRef={chartRef} title={metadata.title} />
                <GetMapCodeButton metadata={metadata} data={data} />
            </div>
        </div>
    );
}

interface AreaArtifactWithControlsProps {
    data: unknown[];
    metadata: AreaChartMetadata;
    rawData: string;
}

function AreaArtifactWithControls({ data, metadata, rawData }: AreaArtifactWithControlsProps) {
    const [chartRef, setChartRef] = useState<ChartRef | null>(null);

    const handleChartRefChange = useCallback((ref: ChartRef | null) => {
        setChartRef(ref);
    }, []);

    return (
        <div className={styles.artifact}>
            <AreaChart
                data={data}
                metadata={metadata}
                onChartRefChange={handleChartRefChange}
            />
            <div className={styles.copyRow}>
                <CopyButton content={rawData} />
                <DownloadButton chartRef={chartRef} title={metadata.title} />
                <GetAreaCodeButton metadata={metadata} data={data} />
            </div>
        </div>
    );
}

export function ChatResponse({ events, status, onSuggestionClick }: ChatResponseProps) {
    interface ConversationTurn {
        userMessages: typeof events;
        intermediateMessages: typeof events;
        chartArtifacts: GenerateChartMetadataResponseMessage[];
        finalAiMessage: typeof events[0] | null;
    }

    const conversationTurns: ConversationTurn[] = [];
    let currentTurn: ConversationTurn = {
        userMessages: [],
        intermediateMessages: [],
        chartArtifacts: [],
        finalAiMessage: null,
    };

    events.forEach((event) => {
        if (!('error' in event) && event.type === 'user') {
            // Start a new turn when we see a user message
            if (currentTurn.userMessages.length > 0 || currentTurn.intermediateMessages.length > 0 || currentTurn.chartArtifacts.length > 0 || currentTurn.finalAiMessage) {
                conversationTurns.push(currentTurn);
                currentTurn = {
                    userMessages: [],
                    intermediateMessages: [],
                    chartArtifacts: [],
                    finalAiMessage: null,
                };
            }
            currentTurn.userMessages.push(event);
        } else if ('error' in event) {
            currentTurn.intermediateMessages.push(event);
        } else if (isGenerateChartMetadataMessage(event)) {
            // only add artifact if data and metadata are present
            if (event.data && event.chart_metadata) {
                currentTurn.chartArtifacts.push(event);
            }
            currentTurn.intermediateMessages.push(event);
        } else if (!('error' in event) && event.type === 'ai') {
            currentTurn.intermediateMessages.push(event);
        } else if (!('error' in event) && event.type === 'output') {
            currentTurn.intermediateMessages.push(event);
        } else if (!('error' in event) && event.type === 'tool') {
            currentTurn.intermediateMessages.push(event);
        }
    });

    if (currentTurn.userMessages.length > 0 || currentTurn.intermediateMessages.length > 0 || currentTurn.chartArtifacts.length > 0 || currentTurn.finalAiMessage) {
        conversationTurns.push(currentTurn);
    }

    conversationTurns.forEach((turn, turnIndex) => {
        const isLastTurn = turnIndex === conversationTurns.length - 1;

        if (status === 'streaming' && isLastTurn) {
            return;
        }

        let lastFinalMessageIdx = -1;
        for (let i = turn.intermediateMessages.length - 1; i >= 0; i--) {
            const msg = turn.intermediateMessages[i];
            if (!('error' in msg) && (msg.type === 'ai' || msg.type === 'output')) {
                lastFinalMessageIdx = i;
                break;
            }
        }

        if (lastFinalMessageIdx !== -1) {
            turn.finalAiMessage = turn.intermediateMessages[lastFinalMessageIdx];
            turn.intermediateMessages.splice(lastFinalMessageIdx, 1);
        }
    });

    const getSummaryText = () => {
        if (status === 'streaming') {
            return `Working...`;
        } else {
            return 'View steps';
        }
    };

    return (
        <>
            {conversationTurns.map((turn, turnIndex) => (
                <div key={`turn-${turnIndex}`}>
                    {/* Render user messages */}
                    {turn.userMessages.map((event, index) => {
                        const messageId = event.id || `user-${turnIndex}-${index}`;
                        return (
                            <div key={messageId} className={styles.userMessage}>
                                {!('error' in event) && event.type === 'user' && event.content}
                            </div>
                        );
                    })}

                    {/* Render intermediate messages (reasoning/tool calls) */}
                    {(() => {
                        const toolCallMessages = turn.intermediateMessages.filter((event) => !isOutputToolEvent(event));

                        if (toolCallMessages.length === 0) return null;

                        return (
                            <details className={styles.reasoningDropdown}>
                                <summary className={styles.reasoningSummary}>
                                    {getSummaryText()}
                                </summary>
                                <div className={styles.reasoningContent}>
                                    {toolCallMessages.map((event, index) => {
                                        const messageId = event.id || `intermediate-${turnIndex}-${index}`;

                                        return (
                                            <div key={messageId} className={styles.intermediateMessage}>
                                                {'error' in event ? (
                                                    <div>Error: {event.error}</div>
                                                ) : (
                                                    <details>
                                                        <summary className={styles.toolSummary}>
                                                            {event.type === 'tool' ? `Tool: ${event.name}` : 'AI'}
                                                        </summary>
                                                        <div className={styles.toolContent}>
                                                            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{event.content ?? ''}</ReactMarkdown>
                                                            <CopyButton content={event.content ?? ''} />
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })()}

                    {/* Render chart artifacts */}
                    {turn.chartArtifacts.map((artifact, index) => {
                        const messageId = `chart-artifact-${turnIndex}-${index}`;
                        const data = artifact.data ? JSON.parse(artifact.data) : [];
                        const metadata = artifact.chart_metadata;

                        if (!metadata) return null;

                        if (artifact.chart_type === 'bar') {
                            return (
                                <ArtifactWithControls
                                    key={messageId}
                                    data={data}
                                    metadata={metadata as BarChartMetadata}
                                    rawData={artifact.data || ''}
                                />
                            );
                        }

                        if (artifact.chart_type === 'map') {
                            return (
                                <MapArtifactWithControls
                                    key={messageId}
                                    data={data}
                                    metadata={metadata as MapChartMetadata}
                                    rawData={artifact.data || ''}
                                />
                            );
                        }

                        if (artifact.chart_type === 'area') {
                            return (
                                <AreaArtifactWithControls
                                    key={messageId}
                                    data={data}
                                    metadata={metadata as AreaChartMetadata}
                                    rawData={artifact.data || ''}
                                />
                            );
                        }

                        return null;
                    })}

                    {/* Render final message (AI or Output) */}
                    {(() => {
                        if (isOutputMessage(turn.finalAiMessage)) {
                            const output = turn.finalAiMessage.output;
                            return (
                                <div className={styles.aiMessage}>
                                    <div className={styles.aiContent}>
                                        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                                            {output.answer}
                                        </ReactMarkdown>
                                    </div>
                                    <div className={styles.copyRow}>
                                        <CopyButton content={output.answer} />
                                    </div>
                                    {output.queries.length > 0 && onSuggestionClick && (
                                        <ExamplePrompts
                                            prompts={output.queries}
                                            onExampleClick={onSuggestionClick}
                                        />
                                    )}
                                </div>
                            );
                        }
                        if (isAiMessage(turn.finalAiMessage)) {
                            return (
                                <div className={styles.aiMessage}>
                                    <div className={styles.aiContent}>
                                        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                                            {turn.finalAiMessage.content ?? ''}
                                        </ReactMarkdown>
                                    </div>
                                    <div className={styles.copyRow}>
                                        <CopyButton content={turn.finalAiMessage.content ?? ''} />
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            ))}
        </>
    );
}
