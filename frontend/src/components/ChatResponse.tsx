import { BarChart } from './Charts/Bar';
import type { AiResponseMessage } from '../types/generated';
import type { StreamEvent, ChatStatus } from '../types/chat';
import styles from './ChatResponse.module.css';
import ReactMarkdown from 'react-markdown';

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
    code: ({ node, inline, ...props }: any) => {
        if (inline) {
            return <code {...props} />;
        }
        return (
            <div className={styles.codeBlock}>
                <code {...props} />
            </div>
        );
    }
};

export function ChatResponse({ events, status }: ChatResponseProps) {
    const intermediateMessages: typeof events = [];
    const artifacts: typeof events = [];
    let finalAiMessage: typeof events[0] | null = null;

    const lastAiMessageIndex = events.map((e, i) => !('error' in e) && e.type === 'ai' ? i : -1)
        .filter(i => i !== -1)
        .pop();

    events.forEach((event, index) => {
        if ('error' in event) {
            intermediateMessages.push(event);
        } else if (event.type === 'bar-chart') {
            artifacts.push(event);
        } else if (event.type === 'ai' && index === lastAiMessageIndex) {
            finalAiMessage = event;
        } else {
            intermediateMessages.push(event);
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
            {intermediateMessages.length > 0 && (
                <details className={styles.reasoningDropdown}>
                    <summary className={styles.reasoningSummary}>
                        {getSummaryText()}
                    </summary>
                    <div className={styles.reasoningContent}>
                        {intermediateMessages.map((event, index) => {
                            const messageId = event.id || `intermediate-${index}`;

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
                                                <ReactMarkdown components={markdownComponents}>{event.content}</ReactMarkdown>
                                            </div>
                                        </details>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </details>
            )}

            {artifacts.map((event, index) => {
                const messageId = event.id || `artifact-${index}`;
                return (
                    <div key={messageId} className={styles.artifact}>
                        {!('error' in event) && event.type === 'bar-chart' && (
                            <BarChart
                                data={JSON.parse(event.content)}
                                metadata={event.metadata}
                            />
                        )}
                    </div>
                );
            })}

            {(() => {
                if (!isAiMessage(finalAiMessage)) return null;
                return (
                    <div className={styles.aiMessage}>
                        <div className={styles.aiContent}>
                            <ReactMarkdown components={markdownComponents}>{(finalAiMessage as AiResponseMessage).content}</ReactMarkdown>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}

