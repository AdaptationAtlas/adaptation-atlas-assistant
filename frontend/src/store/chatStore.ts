
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatStatus, StreamEvent } from '../types/chat';

export interface ChatUIState {
    status: ChatStatus;
    events: StreamEvent[];
    userQuery: string;
    threadId: string | null;
    startStreaming: (query: string) => void;
    addEvent: (event: StreamEvent) => void;
    finishStreaming: () => void;
    setError: (message: string) => void;
    setThreadId: (threadId: string) => void;
    reset: () => void;
}

const CHAT_ACTION_TYPES = {
  startStreaming: 'chat/startStreaming',
  addEvent: 'chat/addEvent',
  finishStreaming: 'chat/finishStreaming',
  setError: 'chat/setError',
  setThreadId: 'chat/setThreadId',
  reset: 'chat/reset',
  anonymous: 'chat/anonymous',
} as const;


const createInitialState = (): Omit<
  ChatUIState,
  'startStreaming' | 'addEvent' | 'finishStreaming' | 'setError' | 'setThreadId' | 'reset'
> => ({
    status: 'idle',
    events: [],
    userQuery: '',
    threadId: null,
});

const initialState = createInitialState();


export const useChatStore = create<ChatUIState>()(
    devtools(
      (set, get) => ({
        ...initialState,
        startStreaming: (query: string) => {
          const baseState = createInitialState();
          set(
            {
              ...baseState,
              status: 'streaming',
              userQuery: query,
            },
            false,
            CHAT_ACTION_TYPES.startStreaming,
          );
        },
        addEvent: (event: StreamEvent) => {
          const { events } = get();
          set(
            {
              events: [...events, event],
            },
            false,
            CHAT_ACTION_TYPES.addEvent,
          );
        },
        finishStreaming: () => {
          const { status } = get();
          if (status !== 'error') {
            set(
              {
                status: 'complete',
              },
              false,
              CHAT_ACTION_TYPES.finishStreaming,
            );
          }
        },
        setError: (message: string) => {
          const { events } = get();
          set(
            {
              status: 'error',
              events: [...events, { id: 'error', timestamp: Date.now(), error: message }],
            },
            false,
            CHAT_ACTION_TYPES.setError,
          );
        },
        setThreadId: (threadId: string) => {
          set(
            {
              threadId,
            },
            false,
            CHAT_ACTION_TYPES.setThreadId,
          );
        },
        reset: () => {
          set(createInitialState(), false, CHAT_ACTION_TYPES.reset);
        },
      }),
      {
        name: 'ChatStore',
        anonymousActionType: CHAT_ACTION_TYPES.anonymous,
        enabled: import.meta.env.DEV,
      },
    ),
  );  