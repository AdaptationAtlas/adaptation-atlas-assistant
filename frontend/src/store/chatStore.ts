
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatStatus, StreamEvent } from '../types/chat';
import type { SidebarState, SidebarActions, Geography } from '../types/sidebar';
import { GEOGRAPHIES, COUNTRIES } from '../constants/sidebar';

export interface ChatUIState extends SidebarActions {
    status: ChatStatus;
    events: StreamEvent[];
    userQuery: string;
    threadId: string | null;
    sidebar: SidebarState;
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

  // Sidebar actions
  toggleSidebarSection: 'chat/toggleSidebarSection',
  setGeography: 'chat/setGeography',
  removeGeography: 'chat/removeGeography',
  setHazardLayer: 'chat/setHazardLayer',
  setHazardSeverity: 'chat/setHazardSeverity',
  setYear: 'chat/setYear',
  setScenario: 'chat/setScenario',
  setExposureLayer: 'chat/setExposureLayer',
  setExposureRange: 'chat/setExposureRange',
  setMaxFarmSize: 'chat/setMaxFarmSize',
  setAdaptiveCapacityLayer: 'chat/setAdaptiveCapacityLayer',
  setAdaptiveCapacityRange: 'chat/setAdaptiveCapacityRange',
  resetSidebar: 'chat/resetSidebar',
  removeTag: 'chat/removeTag',
  anonymous: 'chat/anonymous',
} as const;



const deriveCountryCodes = (geographies: Geography[]): string[] => {
  const countryCodes: string[] = [];

  geographies.forEach((geography) => {
    if (geography.group === 'Region') {
      // Find the region in GEOGRAPHIES and get all country codes
      const region = GEOGRAPHIES.find((item) => item.label === geography.label);
      if (region) {
        const codes = region.value.map((val) => val.gadml0);
        countryCodes.push(...codes);
      }
    } else if (geography.group === 'Country') {
      // Map country name to gadml0 code
      const country = COUNTRIES.find(c => c.name === geography.label);
      if (country) {
        countryCodes.push(country.gadml0);
      }
    }
  });

  return [...new Set(countryCodes)];
};

const initialSidebarState: SidebarState = {
  expandedSections: [],
  geography: {
    selected: [],
    countryCodes: [],
  },
  hazards: {
    heat: {
      name: 'None',
      severityMin: 1,
      severityMax: 4,
    },
    drought: {
      name: 'None',
      severityMin: 1,
      severityMax: 4,
    },
    flood: {
      name: 'None',
      severityMin: 1,
      severityMax: 4,
    },
    year: null,
    scenario: '',
  },
  exposure: {
    crop: {
      name: 'None',
      rangeMin: null,
      rangeMax: null,
    },
    livestock: {
      name: 'None',
      rangeMin: null,
      rangeMax: null,
    },
    population: {
      name: 'None',
      rangeMin: null,
      rangeMax: null,
    },
    maxFarmSize: null,
  },
  adaptiveCapacity: {
    name: 'None',
    rangeMin: null,
    rangeMax: null,
  },
}

const createInitialState = (): Omit<
  ChatUIState,
  | 'startStreaming'
  | 'addEvent'
  | 'finishStreaming'
  | 'setError'
  | 'setThreadId'
  | 'reset'
  | 'toggleSidebarSection'
  | 'setGeography'
  | 'removeGeography'
  | 'setHazardLayer'
  | 'setHazardSeverity'
  | 'setYear'
  | 'setScenario'
  | 'setExposureLayer'
  | 'setExposureRange'
  | 'setMaxFarmSize'
  | 'setAdaptiveCapacityLayer'
  | 'setAdaptiveCapacityRange'
  | 'resetSidebar'
  | 'removeTag'
> => ({
    status: 'idle',
    events: [],
    userQuery: '',
    threadId: null,
    sidebar: initialSidebarState,
});

const initialState = createInitialState();


export const useChatStore = create<ChatUIState>()(
    devtools(
      (set, get) => ({
        ...initialState,
        startStreaming: (query: string) => {
          const { events, threadId } = get();
          const userMessage = {
            id: `user-${Date.now()}`,
            timestamp: Date.now(),
            type: 'user' as const,
            content: query,
          };
          set(
            {
              status: 'streaming',
              userQuery: query,
              threadId,
              events: [...events, userMessage],
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

        toggleSidebarSection: (sectionId: string) => {
          const { sidebar } = get();
          const isExpanded = sidebar.expandedSections.includes(sectionId);
          set(
            {
              sidebar: {
                ...sidebar,
                expandedSections: isExpanded
                  ? sidebar.expandedSections.filter((id) => id !== sectionId)
                  : [...sidebar.expandedSections, sectionId],
              },
            },
            false,
            CHAT_ACTION_TYPES.toggleSidebarSection,
          );
        },

        setGeography: (geographies: Geography[]) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                geography: {
                  selected: geographies,
                  countryCodes: deriveCountryCodes(geographies),
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setGeography,
          );
        },

        removeGeography: (label: string) => {
          const { sidebar } = get();
          const filtered = sidebar.geography.selected.filter(
            (geo) => geo.label !== label,
          );
          set(
            {
              sidebar: {
                ...sidebar,
                geography: {
                  selected: filtered,
                  countryCodes: deriveCountryCodes(filtered),
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.removeGeography,
          );
        },

        setHazardLayer: (
          type: 'heat' | 'drought' | 'flood',
          name: string,
        ) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                hazards: {
                  ...sidebar.hazards,
                  [type]: {
                    ...sidebar.hazards[type],
                    name,
                  },
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setHazardLayer,
          );
        },

        setHazardSeverity: (
          type: 'heat' | 'drought' | 'flood',
          min: number,
          max: number,
        ) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                hazards: {
                  ...sidebar.hazards,
                  [type]: {
                    ...sidebar.hazards[type],
                    severityMin: min,
                    severityMax: max,
                  },
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setHazardSeverity,
          );
        },

        setYear: (year: number | null) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                hazards: {
                  ...sidebar.hazards,
                  year,
                  scenario: year === 2000 || year === null ? '' : sidebar.hazards.scenario
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setYear,
          );
        },

        setScenario: (scenario: string) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                hazards: {
                  ...sidebar.hazards,
                  scenario,
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setScenario,
          );
        },

        setExposureLayer: (
          type: 'crop' | 'livestock' | 'population',
          name: string,
        ) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                exposure: {
                  ...sidebar.exposure,
                  [type]: {
                    ...sidebar.exposure[type],
                    name,
                  },
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setExposureLayer,
          );
        },

        setExposureRange: (
          type: 'crop' | 'livestock' | 'population',
          min: number | null,
          max: number | null,
        ) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                exposure: {
                  ...sidebar.exposure,
                  [type]: {
                    ...sidebar.exposure[type],
                    rangeMin: min,
                    rangeMax: max,
                  },
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setExposureRange,
          );
        },

        setMaxFarmSize: (size: number | null) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                exposure: {
                  ...sidebar.exposure,
                  maxFarmSize: size,
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setMaxFarmSize,
          );
        },

        setAdaptiveCapacityLayer: (name: string) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                adaptiveCapacity: {
                  ...sidebar.adaptiveCapacity,
                  name,
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setAdaptiveCapacityLayer,
          );
        },

        setAdaptiveCapacityRange: (
          min: number | null,
          max: number | null,
        ) => {
          const { sidebar } = get();
          set(
            {
              sidebar: {
                ...sidebar,
                adaptiveCapacity: {
                  ...sidebar.adaptiveCapacity,
                  rangeMin: min,
                  rangeMax: max,
                },
              },
            },
            false,
            CHAT_ACTION_TYPES.setAdaptiveCapacityRange,
          );
        },

        resetSidebar: () => {
          const freshState = createInitialState();
          set(
            {
              sidebar: freshState.sidebar,
            },
            false,
            CHAT_ACTION_TYPES.resetSidebar,
          );
        },

        removeTag: (tagId: string) => {
          const { sidebar } = get();

          const [section, type] = tagId.split('-');

          switch (section) {
            case 'geography': {
              // tagId format: "geography-{index}"
              const index = parseInt(type, 10);
              if (!isNaN(index) && index >= 0 && index < sidebar.geography.selected.length) {
                const label = sidebar.geography.selected[index].label;
                get().removeGeography(label);
              }
              break;
            }

            case 'hazards': {
              if (type === 'heat' || type === 'drought' || type === 'flood') {
                get().setHazardLayer(type, 'None');
              } else if (type === 'year') {
                get().setYear(null);
              } else if (type === 'scenario') {
                get().setScenario('');
              }
              break;
            }

            case 'exposure': {
              if (type === 'crop' || type === 'livestock' || type === 'population') {
                get().setExposureLayer(type, 'None');
              } else if (type === 'farmsize') {
                get().setMaxFarmSize(null);
              }
              break;
            }

            case 'capacity': {
              if (type === 'layer') {
                get().setAdaptiveCapacityLayer('None');
              }
              break;
            }
          }
        }
      }),
      {
        name: 'ChatStore',
        anonymousActionType: CHAT_ACTION_TYPES.anonymous,
        enabled: import.meta.env.DEV,
      },
    ),
  );  