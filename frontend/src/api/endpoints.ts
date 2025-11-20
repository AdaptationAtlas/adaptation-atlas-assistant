/**
 * API endpoint functions using generated types
 */

import type {
  ChatRequest,
} from '../types/generated';
import { apiClient } from './client';
import { readStream, type StreamOptions } from './streaming';

/**
 * Send a chat message and receive streaming responses
 *
 * @param query - The user's question/message
 * @param threadId - Optional conversation thread ID for multi-turn conversations
 * @param options - Streaming options (onMessage, onError, onComplete)
 * @param useSSE - Whether to use Server-Sent Events (true) or NDJSON (false). Default: true
 */
export async function sendChatMessage(
  query: string,
  threadId: string | null,
  options: StreamOptions,
): Promise<void> {
  const requestBody: ChatRequest = {
    query,
    thread_id: threadId,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  const response = await apiClient.fetch<Response>('/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: options.signal,
  });

  await readStream(response, options);
}
