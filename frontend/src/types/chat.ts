import type {
    AiResponseMessage,
    ToolResponseMessage,
    SelectDatasetResponseMessage,
    GenerateTableResponseMessage,
    GenerateBarChartMetadataResponseMessage,
    OutputResponseMessage,
} from './generated';

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
    | (SelectDatasetResponseMessage & { id?: string; timestamp?: number })
    | (GenerateTableResponseMessage & { id?: string; timestamp?: number })
    | (GenerateBarChartMetadataResponseMessage & { id?: string; timestamp?: number })
    | (OutputResponseMessage & { id?: string; timestamp?: number })
    | UserMessage
    | ErrorEvent
);