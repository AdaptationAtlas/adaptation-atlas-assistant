
export interface Geography {
  group: 'Region' | 'Country';
  label: string;
}


export type SeverityLevel = 'None' | 'Moderate' | 'Severe' | 'Extreme';

export interface HazardLayer {
  name: string;
  severityMin: SeverityLevel;
  severityMax: SeverityLevel;
}

export interface HazardsState {

  heat: HazardLayer;
  drought: HazardLayer;
  flood: HazardLayer;
  year: number | null;
  scenario: string;
}


export interface ExposureLayer {
  name: string;
  rangeMin: number | null;
  rangeMax: number | null;
}

export interface ExposureState {
  crop: ExposureLayer;
  livestock: ExposureLayer;
  population: ExposureLayer;
  maxFarmSize: number | null;
}


export interface AdaptiveCapacityLayer {
  name: string;
  rangeMin: number | null;
  rangeMax: number | null;
}


export interface SidebarState {
  expandedSections: string[];
  geography: {
    selected: Geography[];
    countryCodes: string[];
  };
  hazards: HazardsState;
  exposure: ExposureState;
  adaptiveCapacity: AdaptiveCapacityLayer;
}


export interface PromptContextTag {
  id: string;
  label: string;
}


export interface SidebarActions {
  toggleSidebarSection: (sectionId: string) => void;

  setGeography: (geographies: Geography[]) => void;
  removeGeography: (label: string) => void;

  setHazardLayer: (
    type: 'heat' | 'drought' | 'flood',
    name: string,
  ) => void;
  setHazardSeverity: (
    type: 'heat' | 'drought' | 'flood',
    min: SeverityLevel,
    max: SeverityLevel,
  ) => void;
  setYear: (year: number | null) => void;
  setScenario: (scenario: string) => void;

  setExposureLayer: (
    type: 'crop' | 'livestock' | 'population',
    name: string,
  ) => void;
  setExposureRange: (
    type: 'crop' | 'livestock' | 'population',
    min: number | null,
    max: number | null,
  ) => void;
  setMaxFarmSize: (size: number | null) => void;

  setAdaptiveCapacityLayer: (name: string) => void;
  setAdaptiveCapacityRange: (
    min: number | null,
    max: number | null,
  ) => void;

  resetSidebar: () => void;
  removeTag: (tagId: string) => void;
}
