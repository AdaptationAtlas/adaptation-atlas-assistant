
export interface Geography {
  group: 'Region' | 'Country';
  label: string;
}


export interface HazardLayer {
  name: string;
  severityMin: number;
  severityMax: number;
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


export interface SidebarActions {
  toggleSidebarSection: (sectionId: string) => void;

  setGeography: (geographies: Geography[]) => void;

  setHazardLayer: (
    type: 'heat' | 'drought' | 'flood',
    name: string,
  ) => void;
  setHazardSeverity: (
    type: 'heat' | 'drought' | 'flood',
    min: number,
    max: number,
  ) => void;
  setYear: (year: number) => void;
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
  setMaxFarmSize: (size: number) => void;

  setAdaptiveCapacityLayer: (name: string) => void;
  setAdaptiveCapacityRange: (
    min: number | null,
    max: number | null,
  ) => void;

  resetSidebar: () => void;
}
