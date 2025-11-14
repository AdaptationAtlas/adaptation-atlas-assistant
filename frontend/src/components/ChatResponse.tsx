import { useState } from 'react';
import { BarChart } from './Charts/Bar';
import type { AiResponseMessage } from '../types/generated';
import type { StreamEvent, ChatStatus } from '../types/chat';
import styles from './ChatResponse.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, CheckIcon } from '../assets/icons';
import { copyToClipboard } from '../utils/clipboard';

interface ChatResponseProps {
    events: StreamEvent[];
    status: ChatStatus;
}

function isAiMessage(event: StreamEvent | null): event is AiResponseMessage & { id?: string; timestamp?: number } {
    if (!event) return false;
    if ('error' in event) return false;
    return event.type === 'ai';
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
    }
};

interface CopyButtonProps {
    content: string;
    className?: string;
}

function CopyButton({ content, className = '' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`${styles.copyButton} ${className}`}
            title="Copy raw markdown"
            aria-label="Copy raw markdown"
        >
            {copied ? (
                <CheckIcon className={styles.copyIcon} />
            ) : (
                <CopyIcon className={styles.copyIcon} />
            )}
        </button>
    );
}

export function ChatResponse({ events, status }: ChatResponseProps) {
    interface ConversationTurn {
        userMessages: typeof events;
        intermediateMessages: typeof events;
        artifacts: typeof events;
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
        } else if (!('error' in event) && event.type === 'bar-chart') {
            currentTurn.artifacts.push(event);
        } else if (!('error' in event) && event.type === 'ai') {
            currentTurn.intermediateMessages.push(event);
        } else if (!('error' in event) && event.type === 'tool') {
            currentTurn.intermediateMessages.push(event);
        }
    });

    if (currentTurn.userMessages.length > 0 || currentTurn.intermediateMessages.length > 0 || currentTurn.artifacts.length > 0 || currentTurn.finalAiMessage) {
        conversationTurns.push(currentTurn);
    }

    // for each turn, find the last AI message and move it to finalAiMessage
    conversationTurns.forEach((turn) => {
        let lastAiMessageIdx = -1;
        for (let i = turn.intermediateMessages.length - 1; i >= 0; i--) {
            const msg = turn.intermediateMessages[i];
            if (!('error' in msg) && msg.type === 'ai') {
                lastAiMessageIdx = i;
                break;
            }
        }

        if (lastAiMessageIdx !== -1) {
            turn.finalAiMessage = turn.intermediateMessages[lastAiMessageIdx];
            turn.intermediateMessages.splice(lastAiMessageIdx, 1);
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
                    {turn.intermediateMessages.length > 0 && (
                        <details className={styles.reasoningDropdown}>
                            <summary className={styles.reasoningSummary}>
                                {getSummaryText()}
                            </summary>
                            <div className={styles.reasoningContent}>
                                {turn.intermediateMessages.map((event, index) => {
                                    const messageId = event.id || `intermediate-${turnIndex}-${index}`;

                                    return (
                                        <div key={messageId} className={styles.intermediateMessage}>
                                            {'error' in event ? (
                                                <div>Error: {event.error}</div>
                                            ) : (
                                                <details>
                                                    <summary className={styles.toolSummary}>
                                                        <div className={styles.messageHeader}>
                                                            <span>{event.type === 'tool' ? `Tool: ${event.name}` : 'AI'}</span>
                                                            <CopyButton content={event.content} />
                                                        </div>
                                                    </summary>
                                                    <div className={styles.toolContent}>
                                                        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{event.content}</ReactMarkdown>
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    )}

                    {/* Render artifacts (charts) */}
                    {turn.artifacts.map((event, index) => {
                        const messageId = event.id || `artifact-${turnIndex}-${index}`;
                        return (
                            <div key={messageId} className={styles.artifact}>
                                {!('error' in event) && event.type === 'bar-chart' && (
                                    <>
                                        <div className={styles.artifactHeader}>
                                            <CopyButton content={event.content} />
                                        </div>
                                        <BarChart
                                            data={JSON.parse(event.content)}
                                            metadata={event.metadata}
                                        />
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Render final AI message */}
                    {(() => {
                        if (!isAiMessage(turn.finalAiMessage)) return null;
                        return (
                            <div className={styles.aiMessage}>
                                <div className={styles.aiMessageHeader}>
                                    <CopyButton content={(turn.finalAiMessage as AiResponseMessage).content} />
                                </div>
                                <div className={styles.aiContent}>
                                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{(turn.finalAiMessage as AiResponseMessage).content}</ReactMarkdown>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ))}
        </>
    );
}

