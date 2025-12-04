import { useState, useCallback } from 'react';
import { useAuth } from '../api/hooks';
import { sendChatMessage, createStreamController } from '../api';
import { useChatStore } from '../store/chatStore';
import { contextTagsToText, attachmentsToText } from '../utils/tagFormatting';
import { PromptBuilderSidebar } from './PromptBuilderSidebar';
import { EmptyState } from './EmptyState';
import { PromptBox } from './PromptBox';
import { ChatResponse } from './ChatResponse';
import { SIDEBAR_SECTIONS, EXPOSURE_UNITS, ADAPTIVE_CAPACITY_UNITS } from '../constants/sidebar';
import type { SidebarState, PromptContextTag } from '../types/sidebar';
import AtlasLogo from '../assets/atlas-a.svg';
import styles from './Chat.module.css';

const examplePrompts = [
    'How is maize production projected to change under future climate scenarios in Kenya?',
    'Which regions in West Africa face the highest exposure to drought risk?',
    'Compare adaptive capacity between smallholder farmers in Malawi and Zambia',
];

function sidebarToContextTags(sidebar: SidebarState): PromptContextTag[] {
    const tags: PromptContextTag[] = [];

    sidebar.geography.selected.forEach((geo, index) => {
        tags.push({
            id: `geography-${index}`,
            label: geo.label,
        });
    });

    const hazardTypes = ['heat', 'drought', 'flood'] as const;
    hazardTypes.forEach((type) => {
        const hazard = sidebar.hazards[type];
        if (hazard.name !== 'None') {
            tags.push({
                id: `hazards-${type}`,
                label: `${hazard.name}: ${hazard.severityMin}-${hazard.severityMax}`,
            });
        }
    });

    if (sidebar.hazards.year !== null) {
        tags.push({
            id: 'hazards-year',
            label: `Year: ${sidebar.hazards.year}`,
        });
    }

    if (sidebar.hazards.scenario && sidebar.hazards.scenario !== '') {
        tags.push({
            id: 'hazards-scenario',
            label: `Scenario: ${sidebar.hazards.scenario}`,
        });
    }

    const exposureTypes = ['crop', 'livestock', 'population'] as const;
    exposureTypes.forEach((type) => {
        const exposure = sidebar.exposure[type];
        if (exposure.name !== 'None') {
            const hasRange = exposure.rangeMin !== null && exposure.rangeMax !== null;
            const unit = EXPOSURE_UNITS[type];
            const label = hasRange
                ? `${exposure.name}: ${exposure.rangeMin}-${exposure.rangeMax} ${unit}`
                : exposure.name;
            tags.push({
                id: `exposure-${type}`,
                label,
            });
        }
    });

    if (sidebar.exposure.maxFarmSize !== null) {
        tags.push({
            id: 'exposure-farmsize',
            label: `Farm Size: ${sidebar.exposure.maxFarmSize} ha`,
        });
    }

    if (sidebar.adaptiveCapacity.name !== 'None') {
        const hasRange = sidebar.adaptiveCapacity.rangeMin !== null && sidebar.adaptiveCapacity.rangeMax !== null;
        const unit = ADAPTIVE_CAPACITY_UNITS[sidebar.adaptiveCapacity.name] || '';
        const label = hasRange && unit
            ? `${sidebar.adaptiveCapacity.name}: ${sidebar.adaptiveCapacity.rangeMin}-${sidebar.adaptiveCapacity.rangeMax} ${unit}`
            : hasRange
            ? `${sidebar.adaptiveCapacity.name}: ${sidebar.adaptiveCapacity.rangeMin}-${sidebar.adaptiveCapacity.rangeMax}`
            : sidebar.adaptiveCapacity.name;
        tags.push({
            id: 'capacity-layer',
            label,
        });
    }

    sidebar.attachments.files.forEach((file) => {
        tags.push({
            id: `attachments-${file.id}`,
            label: file.name,
        });
    });

    return tags;
}

export function Chat() {
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
        removeTag,
    } = useChatStore();

    // Convert sidebar state to context tags
    const contextTags = sidebarToContextTags(sidebar);

    const handlePromptSubmit = useCallback(async (value: string) => {
        if (!value.trim()) return;

        // Build query with context and attachments
        const contextTagsAsText = contextTagsToText(contextTags);
        const attachmentsAsText = attachmentsToText(sidebar.attachments.files);

        const queryParts: string[] = [];
        if (contextTagsAsText) queryParts.push(contextTagsAsText);
        if (attachmentsAsText) queryParts.push(attachmentsAsText);
        queryParts.push(`Question: ${value}`);

        const queryWithContext = queryParts.join('\n\n');

        startStreaming(value);

        const controller = createStreamController();

        try {
            await sendChatMessage(queryWithContext, threadId, {
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
    }, [contextTags, sidebar.attachments.files, startStreaming, addEvent, finishStreaming, setError, threadId, setThreadId]);

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
                        <ChatResponse events={events} status={status} onSuggestionClick={handlePromptSubmit} />
                    </div>
                )}

                <div className={styles.promptContainer}>
                    <PromptBox
                        onSubmit={handlePromptSubmit}
                        context={contextTags}
                        onRemoveTag={removeTag}
                    />
                </div>
            </main>
        </div>
    );
}
