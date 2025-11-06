export type ChatStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface StreamEvent {
    id?: string;
    timestamp?: number;
  }