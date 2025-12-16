/**
 * API endpoint functions using generated types
 */

import type {
  ChatRequest,
  OutputResponseMessage,
} from '../types/generated';
import { apiClient } from './client';
import { readStream, type StreamOptions, type ChatMessage } from './streaming';

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

/**
 * Get example query suggestions based on context
 *
 * @param context - Context string from sidebar (geography, hazards, etc.)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Array of suggested queries
 */
export async function getSuggestions(
  context: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const query = context
    ? `Based on this context: ${context}\n\nSuggest 3 specific questions I could ask about climate adaptation data. Be concise - just give the questions without explanations.`
    : 'Suggest 3 specific questions I could ask about climate adaptation data in Africa. Be concise - just give the questions without explanations.';

  const requestBody: ChatRequest = {
    query,
    thread_id: null,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  const response = await apiClient.fetch<Response>('/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal,
  });

  const messages: ChatMessage[] = [];
  await readStream(response, {
    onMessage: (message) => {
      messages.push(message);
    },
    onError: (error) => {
      throw error;
    },
    onComplete: () => {},
  });

  for (const msg of messages) {
    if ('type' in msg && msg.type === 'output' && 'output' in msg) {
      const outputMsg = msg as OutputResponseMessage;
      if (outputMsg.output?.queries && outputMsg.output.queries.length > 0) {
        return outputMsg.output.queries;
      }
    }
  }

  return [];
}
