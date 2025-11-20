import { useState, useCallback } from 'react';
import { useAuth } from '../api/hooks';
import { sendChatMessage, createStreamController } from '../api';
import { useChatStore } from '../store/chatStore';
import { PromptBuilderSidebar } from './PromptBuilderSidebar';
import { EmptyState } from './EmptyState';
import { PromptBox } from './PromptBox';
import { ChatResponse } from './ChatResponse';
import { SIDEBAR_SECTIONS } from '../constants/sidebar';
import AtlasLogo from '../assets/atlas-a.svg';
import styles from './Chat.module.css';

const examplePrompts = [
    'How is maize production projected to change under future climate scenarios in Kenya?',
    'Which regions in West Africa face the highest exposure to drought risk?',
    'Compare adaptive capacity between smallholder farmers in Malawi and Zambia',
];

export function Chat() {
    const [selectedContext] = useState<{
        location?: string;
        crop?: string;
        files?: number;
    }>({});
    const [showTooltip, setShowTooltip] = useState(false);
    const { isAuthenticated, logout } = useAuth();

    // Chat store - includes chat state and sidebar state
    const {
        status,
        events,
        threadId,
        sidebar,
        startStreaming,
        addEvent,
        finishStreaming,
        setError,
        setThreadId,
        toggleSidebarSection,
    } = useChatStore();


    const handlePromptSubmit = useCallback(async (value: string) => {
        if (!value.trim()) return;

        startStreaming(value);

        const controller = createStreamController();

        try {
            await sendChatMessage(value, threadId, {
                onMessage: (message) => {
                    if (!threadId && 'thread_id' in message && typeof message.thread_id === 'string') {
                        setThreadId(message.thread_id);
                    }

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
    }, [startStreaming, addEvent, finishStreaming, setError, threadId, setThreadId]);

    const handleExampleClick = (prompt: string) => {
        handlePromptSubmit(prompt);
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

            <PromptBuilderSidebar
                sections={SIDEBAR_SECTIONS.map((section) => ({
                    ...section,
                    expanded: sidebar.expandedSections.includes(section.id),
                }))}
                activeSections={sidebar.expandedSections}
                onToggleSection={toggleSidebarSection}
            />

            <main className={styles.mainContent}>
                {status === 'idle' && (
                    <EmptyState
                        examplePrompts={examplePrompts}
                        onExampleClick={handleExampleClick}
                    />
                )}

                {status !== 'idle' && (
                    <div className={styles.contentArea}>
                        <ChatResponse events={events} status={status} />
                    </div>
                )}

                <div className={styles.promptContainer}>
                    <PromptBox
                        onSubmit={handlePromptSubmit}
                        context={selectedContext}
                    />
                </div>
            </main>
        </div>
    );
}
