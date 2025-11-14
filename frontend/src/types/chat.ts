import type { AiResponseMessage, BarChartResponseMessage, ToolResponseMessage } from './generated';

export type ChatStatus = 'idle' | 'streaming' | 'complete' | 'error';

export type ErrorEvent = {
    id: string;
    timestamp: number;
    error: string;
};

export type UserMessage = {
    id: string;
    timestamp: number;
    type: 'user';
    content: string;
};

export type StreamEvent = (
    | (AiResponseMessage & { id?: string; timestamp?: number })
    | (ToolResponseMessage & { id?: string; timestamp?: number })
    | (BarChartResponseMessage & { id?: string; timestamp?: number })
    | UserMessage
    | ErrorEvent
);