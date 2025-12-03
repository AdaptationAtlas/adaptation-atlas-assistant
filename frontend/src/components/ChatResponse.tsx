import { useState, useCallback } from 'react';
import { BarChart } from './Charts/Bar';
import type { ChartProps } from './Charts/Main';
import type {
    AiResponseMessage,
    GenerateBarChartMetadataResponseMessage,
    OutputResponseMessage,
} from '../types/generated';
import { ExamplePrompts } from './ExamplePrompts';
import type { StreamEvent, ChatStatus } from '../types/chat';
import { Button } from './Button';
import styles from './ChatResponse.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, CheckIcon, CodeIcon } from '../assets/icons';
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

function isGenerateBarChartMetadataMessage(event: StreamEvent): event is GenerateBarChartMetadataResponseMessage & { id?: string; timestamp?: number } {
    if (!event || 'error' in event) return false;
    return event.type === 'tool' && 'name' in event && event.name === 'generate_bar_chart_metadata';
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
    spec: ChartProps['spec'] | null;
}

// Custom JSON serializer that converts functions to their string representation
function serializeSpec(spec: object): string {
    return JSON.stringify(
        spec,
        (_key, value) => {
            if (typeof value === 'function') {
                return value.toString();
            }
            return value;
        },
        2
    );
}

function GetCodeButton({ spec }: GetCodeButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!spec) return;

        const specString = serializeSpec(spec);
        const success = await copyToClipboard(specString);
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

interface ArtifactWithControlsProps {
    data: unknown[];
    metadata: NonNullable<GenerateBarChartMetadataResponseMessage['bar_chart_metadata']>;
    rawData: string;
}

function ArtifactWithControls({ data, metadata, rawData }: ArtifactWithControlsProps) {
    const [currentSpec, setCurrentSpec] = useState<ChartProps['spec'] | null>(null);

    const handleSpecChange = useCallback((spec: ChartProps['spec']) => {
        setCurrentSpec(spec);
    }, []);

    return (
        <div className={styles.artifact}>
            <BarChart
                data={data}
                metadata={metadata}
                onSpecChange={handleSpecChange}
            />
            <div className={styles.copyRow}>
                <CopyButton content={rawData} />
                <GetCodeButton spec={currentSpec} />
            </div>
        </div>
    );
}

export function ChatResponse({ events, status, onSuggestionClick }: ChatResponseProps) {
    interface ConversationTurn {
        userMessages: typeof events;
        intermediateMessages: typeof events;
        artifacts: GenerateBarChartMetadataResponseMessage[];
        finalAiMessage: typeof events[0] | null;
    }

    const conversationTurns: ConversationTurn[] = [];
    let currentTurn: ConversationTurn = {
        userMessages: [],
        intermediateMessages: [],
        artifacts: [],
        finalAiMessage: null,
    };

    events.forEach((event) => {
        if (!('error' in event) && event.type === 'user') {
            // Start a new turn when we see a user message
            if (currentTurn.userMessages.length > 0 || currentTurn.intermediateMessages.length > 0 || currentTurn.artifacts.length > 0 || currentTurn.finalAiMessage) {
                conversationTurns.push(currentTurn);
                currentTurn = {
                    userMessages: [],
                    intermediateMessages: [],
                    artifacts: [],
                    finalAiMessage: null,
                };
            }
            currentTurn.userMessages.push(event);
        } else if ('error' in event) {
            currentTurn.intermediateMessages.push(event);
        } else if (isGenerateBarChartMetadataMessage(event)) {
            // only add artifact if not null 
            if (event.data && event.bar_chart_metadata) {
                currentTurn.artifacts.push(event);
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

    if (currentTurn.userMessages.length > 0 || currentTurn.intermediateMessages.length > 0 || currentTurn.artifacts.length > 0 || currentTurn.finalAiMessage) {
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

                    {/* Render artifacts (charts) */}
                    {turn.artifacts.map((artifact, index) => {
                        const messageId = `artifact-${turnIndex}-${index}`;

                        const data = artifact.data ? JSON.parse(artifact.data) : [];
                        const metadata = artifact.bar_chart_metadata;

                        if (!metadata) return null;

                        return (
                            <ArtifactWithControls
                                key={messageId}
                                data={data}
                                metadata={metadata}
                                rawData={artifact.data || ''}
                            />
                        );
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
