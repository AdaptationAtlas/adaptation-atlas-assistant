import { useState, useCallback } from 'react';
import {
  sendChatMessage,
} from './endpoints';
import { createStreamController, type ChatMessage } from './streaming';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<ReturnType<
    typeof createStreamController
  > | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      setIsStreaming(true);
      setError(null);

      const controller = createStreamController();
      setAbortController(controller);

      try {
        await sendChatMessage(
          query,
          null,
          {
            onMessage: (message) => {
              setMessages((prev) => [...prev, message]);
            },
            onError: (err) => {
              setError(err.message);
            },
            onComplete: () => {
              setIsStreaming(false);
              setAbortController(null);
            },
            signal: controller.signal,
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [],
  );

  const cancelStream = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
    }
  }, [abortController]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}

export function useSimpleChat() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [responses, setResponses] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentMessage(query);
    setResponses([]);

    const controller = createStreamController();

    try {
      await sendChatMessage(
        query,
        null,
        {
          onMessage: (message) => {
            setResponses((prev) => [...prev, message]);
          },
          onError: (err) => {
            setError(err.message);
            setIsLoading(false);
          },
          onComplete: () => {
            setIsLoading(false);
          },
          signal: controller.signal,
        },
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  return {
    send,
    currentMessage,
    responses,
    isLoading,
    error,
  };
}
