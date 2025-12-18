/**
 * Streaming utilities for handling SSE and NDJSON responses
 */

import type {
  AiResponseMessage,
  ToolResponseMessage,
  SelectDatasetResponseMessage,
  GenerateTableResponseMessage,
  GenerateChartMetadataResponseMessage,
  ErrorResponseMessage,
  OutputResponseMessage,
} from '../types/generated';

export type ChatMessage =
  | AiResponseMessage
  | ToolResponseMessage
  | SelectDatasetResponseMessage
  | GenerateTableResponseMessage
  | GenerateChartMetadataResponseMessage
  | ErrorResponseMessage
  | OutputResponseMessage;

export interface StreamOptions {
  onMessage: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
}

function parseSSEData(line: string): ChatMessage | null {
  if (line.startsWith('data: ')) {
    const jsonStr = line.slice(6);
    try {
      return JSON.parse(jsonStr) as ChatMessage;
    } catch (error) {
      console.error('Failed to parse SSE data:', error);
      return null;
    }
  }
  return null;
}


export async function readStream(
  response: Response,
  options: StreamOptions,
): Promise<void> {
  const { onMessage, onError, onComplete, signal } = options;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        throw new Error('Stream aborted');
      }

      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          const message = parseSSEData(buffer)
          if (message) {
            onMessage(message);
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const message = parseSSEData(line);
        if (message) {
          onMessage(message);
        }
      }
    }

    onComplete?.();
  } catch (error) {
    if (error instanceof Error) {
      onError?.(error);
    } else {
      onError?.(new Error('Unknown streaming error'));
    }
  }
}

export function createStreamController(): {
  signal: AbortSignal;
  abort: () => void;
} {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
  };
}
