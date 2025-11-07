
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatStatus, StreamEvent } from '../types/chat';

export interface ChatUIState {
    status: ChatStatus;
    events: StreamEvent[];
}  

const CHAT_ACTION_TYPES = {
  startStreaming: 'chat/startStreaming',
  addEvent: 'chat/addEvent',
  finishStreaming: 'chat/finishStreaming',
  setError: 'chat/setError',
  reset: 'chat/reset',
  anonymous: 'chat/anonymous',
} as const;


const createInitialState = (): Omit<
  ChatUIState,
  'startStreaming' | 'addEvent' | 'finishStreaming' | 'setError' | 'reset'
> => ({
    status: 'idle',
    events: [],
}); 

const initialState = createInitialState();


export const useChatStore = create<ChatUIState>()(
    devtools(
      (set, get) => ({
        ...initialState,
        startStreaming: () => {
          const baseState = createInitialState();
          set(
            {
              ...baseState,
              status: 'streaming',
            },
            false,
            CHAT_ACTION_TYPES.startStreaming,
          );
        },
        addEvent: () => {
          return
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
        setError: (
          // message: string
        ) => {
          set(
            {
              status: 'error',
            },
            false,
            CHAT_ACTION_TYPES.setError,
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