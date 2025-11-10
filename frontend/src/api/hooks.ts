import { useState, useCallback, useEffect } from 'react';
import type { User } from '../types/generated';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  sendChatMessage,
  isAuthenticated as checkAuthenticated,
} from './endpoints';
import { createStreamController, type ChatMessage } from './streaming';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogin(username, password);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    isLoading,
    error,
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checkAuthenticated()) {
      fetchUser();
    }
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  };
}

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
