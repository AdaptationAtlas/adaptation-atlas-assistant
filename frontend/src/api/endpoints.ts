/**
 * API endpoint functions using generated types
 */

import type {
  BodyLoginTokenPost,
  Token,
  User,
  ChatRequest,
} from '../types/generated';
import { apiClient } from './client';
import { readStream, type StreamOptions } from './streaming';

/**
 * JWT token login
 */
export async function login(
  username: string,
  password: string,
): Promise<Token> {
  const formData: BodyLoginTokenPost = {
    username,
    password,
    grant_type: 'password',
  };

  const token = await apiClient.postForm<Token>('/token', {
    username: formData.username,
    password: formData.password,
    grant_type: formData.grant_type || '',
  });

  apiClient.setToken(token.access_token);

  return token;
}

/**
 * Logout
 */
export function logout(): void {
  apiClient.clearToken();
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/me');
}

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
 * Check if the user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return apiClient.isAuthenticated();
}

/**
 * Get the current authentication token
 */
export function getToken(): string | null {
  return apiClient.getToken();
}
