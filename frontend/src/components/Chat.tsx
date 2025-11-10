import { useState, useCallback } from 'react';
import { useAuth } from '../api/hooks';
import { sendChatMessage, createStreamController } from '../api';
import { useChatStore } from '../store/chatStore';
import { PromptBuilderSidebar } from './PromptBuilderSidebar';
import { EmptyState } from './EmptyState';
import { PromptBox } from './PromptBox';
import { BarChart } from './Charts/Bar';
import { AreaChart } from './Charts/Area';
import AtlasLogo from '../assets/atlas-a.svg';
import styles from './Chat.module.css';
import { areaChartData } from '../../data/areaChart';
import { barChartData } from '../../data/barChart';

const examplePrompts = [
    'How is maize production projected to change under future climate scenarios in Kenya?',
    'Which regions in West Africa face the highest exposure to drought risk?',
    'Compare adaptive capacity between smallholder farmers in Malawi and Zambia',
];

const sidebarSections = [
    { id: 'geography', label: 'GEOGRAPHY', expanded: false },
    { id: 'hazards', label: 'CLIMATE HAZARDS', expanded: false },
    { id: 'exposure', label: 'EXPOSURE', expanded: false },
    { id: 'capacity', label: 'ADAPTIVE CAPACITY', expanded: false },
    { id: 'attachments', label: 'ATTACHMENTS', expanded: false },
];

export function Chat() {
    const [activeSections, setActiveSections] = useState<string[]>([]);
    const [selectedContext] = useState<{
        location?: string;
        crop?: string;
        files?: number;
    }>({});
    const [showTooltip, setShowTooltip] = useState(false);
    const { isAuthenticated, logout } = useAuth();

    // Chat store
    const { status, events, userQuery, startStreaming, addEvent, finishStreaming, setError } = useChatStore();

    const handlePromptSubmit = useCallback(async (value: string) => {
        if (!value.trim()) return;

        startStreaming(value);

        const controller = createStreamController();

        try {
            await sendChatMessage(value, {
                onMessage: (message) => {
                    addEvent({
                        ...message,
                        id: `msg-${Date.now()}-${Math.random()}`,
                        timestamp: Date.now(),
                    });
                },
                onError: (error) => {
                    setError(error.message);
                },
                onComplete: () => {
                    finishStreaming();
                },
                signal: controller.signal,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
            setError(errorMessage);
        }
    }, [startStreaming, addEvent, finishStreaming, setError]);

    const handleExampleClick = (prompt: string) => {
        handlePromptSubmit(prompt);
    };

    const toggleSection = (sectionId: string) => {
        setActiveSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleAvatarClick = () => {
        if (isAuthenticated) {
            logout();
        }
        window.location.href = '/login';
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-white">
            {/* Left gradient sidebar */}
            <div className={styles.leftBar}>
                <div className={styles.logoContainer}>
                    <img
                        src={AtlasLogo}
                        alt="Atlas Logo"
                        className={styles.logo}
                    />
                </div>
                <div className={styles.avatarContainer}>
                    <button
                        className={styles.userAvatar}
                        onClick={handleAvatarClick}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        aria-label={isAuthenticated ? 'Log out' : 'Log in'}
                    >
                        <span>👤</span>
                    </button>
                    {showTooltip && (
                        <div className={styles.tooltip}>
                            {isAuthenticated ? 'Log out' : 'Log in'}
                        </div>
                    )}
                </div>
            </div>

            {/* Prompt Builder Sidebar */}
            <PromptBuilderSidebar
                sections={sidebarSections}
                activeSections={activeSections}
                onToggleSection={toggleSection}
            />

            {/* Main Content */}
            <main className={styles.mainContent}>
                {status === 'idle' && (
                    <EmptyState
                        examplePrompts={examplePrompts}
                        onExampleClick={handleExampleClick}
                    />
                )}

                {status !== 'idle' && (
                    <div style={{ padding: '2rem' }}>
                        {userQuery && (
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>You:</strong> {userQuery}
                            </div>
                        )}
                        <div style={{ marginBottom: '1rem' }}>Status: {status}</div>
                        <div>
                            {events.map((event, index) => {
                                const messageId = event.id || index;

                                return (
                                    <div key={messageId} style={{ marginBottom: '1.5rem' }}>
                                        {'error' in event ? (
                                            <div>Error: {event.error}</div>
                                        ) : (
                                            <details>
                                                <summary style={{
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {event.type === 'tool' ? `Tool: ${event.name}` : 'AI'}
                                                </summary>
                                                <pre style={{
                                                    whiteSpace: 'pre-wrap',
                                                    wordWrap: 'break-word',
                                                    marginLeft: '1.5rem',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {event.content}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className={styles.promptContainer}>
                    <PromptBox
                        onSubmit={handlePromptSubmit}
                        context={selectedContext}
                    />
                </div>

                {barChartData.map((chart, index) => (
                    <BarChart
                        key={`${chart.title}-${index}`}
                        data={chart.values ?? []}
                        xField="percentage"
                        categoryField="type"
                        hasLegend
                        colorDomain={chart.colorDomain}
                        colorRange={chart.colorRange}
                        textColor={chart.textColor}
                        title={chart.title}
                    />
                ))}
                {areaChartData.map((chart, index) => (
                    <AreaChart
                        key={`${chart.title}-${index}`}
                        data={chart.values ?? []}
                        xField="year"
                        yField="stock"
                        categoryField={chart.categoryField}
                        xLabel="Year"
                        yLabel={chart.units}
                        title={chart.title}
                        colorDomain={chart.colorDomain}
                        colorRange={chart.colorRange}
                    />
                ))}
            </main>
        </div>
    );
}
