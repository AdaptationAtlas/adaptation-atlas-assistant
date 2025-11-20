/**
 * TODO: Import actual regions data
 */
export const REGIONS: string[] = [
  'East Africa',
  'West Africa',
  'Southern Africa',
  'Central Africa',
  'North Africa',
  // ...
];

/**
 * TODO: Import actual countries data
 */
export const COUNTRIES: Array<{ name: string; gadml0: string }> = [
  { name: 'Kenya', gadml0: 'KEN' },
  { name: 'Ethiopia', gadml0: 'ETH' },
  { name: 'Tanzania', gadml0: 'TZA' },
  // Add more countries as needed
];

/**
 * TODO: Import actual geography data
 */
export const GEOGRAPHIES: Array<{
  label: string;
  value: Array<{ gadml0: string }>;
}> = [
  {
    label: 'East Africa',
    value: [{ gadml0: 'KEN' }, { gadml0: 'ETH' }, { gadml0: 'TZA' }],
  },
];

export const HEAT_LAYER_OPTIONS = [
  'None',
  'Heat Stress Generic Crop',
  'Heat Stress Humans',
  'Heat Stress Livestock',
  'Heat Stress Maize',
] as const;


export const DROUGHT_LAYER_OPTIONS = [
  'None',
  'Dry Days',
  'Soil Water Stress',
  "Thornthwaite's Aridity Index",
] as const;


export const FLOOD_LAYER_OPTIONS = ['None', 'Waterlogging'] as const;


export const SEVERITY_MARKS = [
  { value: 1, label: 'None' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
  { value: 4, label: 'Extreme' },
] as const;


export const TIME_PERIODS = [
  { label: '2000 (Baseline)', value: 2000 },
  { label: '2020', value: 2020 },
  { label: '2030', value: 2030 },
  { label: '2040', value: 2040 },
  { label: '2050', value: 2050 },
] as const;

export const SCENARIOS = [
  { label: 'SSP1-2.6 (Low emissions)', value: 'ssp126' },
  { label: 'SSP2-4.5 (Medium emissions)', value: 'ssp245' },
  { label: 'SSP5-8.5 (High emissions)', value: 'ssp585' },
] as const;

/**
 * TODO: confirm real values
 */
export const CROP_LAYER_OPTIONS = [
  'None',
  'Maize',
  'Rice',
  'Wheat',
  'Cassava',
  // Add more crop layers as needed
] as const;

/**
 * TODO: confirm real values
 */
export const LIVESTOCK_LAYER_OPTIONS = [
  'None',
  'Cattle',
  'Goats',
  'Sheep',
  'Poultry',
  // Add more livestock layers as needed
] as const;

/**
 * TODO: confirm real values
 */
export const POPULATION_LAYER_OPTIONS = [
  'None',
  'Total Population',
  'Rural Population',
  'Urban Population',
  // Add more population layers as needed
] as const;

export const FARM_SIZES = [
  { value: 1, label: '1ha' },
  { value: 2, label: '2ha' },
  { value: 5, label: '5ha' },
  { value: 10, label: '10ha' },
  { value: 20, label: '20ha' },
] as const;

/**
 * TODO: confirm real values
 */
export const ADAPTIVE_CAPACITY_LAYER_OPTIONS = [
  'None',
  'Education Years',
  'Health Facility Access',
  'Gender Equity',
  'Wealth',
  'Banking Access',
  'Mobile Broadband',
  'Market Access',
] as const;


export const ADAPTIVE_CAPACITY_LABELS: Record<string, string> = {
  'Education Years': 'Index of Expected and Completed Years of Schooling (0-1)',
  'Health Facility Access': 'Motorized Travel Time to Facilities (Minutes)',
  'Gender Equity': "Index of Women's Agency (0-1)",
  Wealth: 'International Wealth Index (0-100)',
  'Banking Access': 'Proportion of Households with a Bank Account (0-1)',
  'Mobile Broadband': 'Megabits per Second (Mb/s)',
  'Market Access': 'Travel Time to Cities (Minutes)',
};

/**
 * TODO: confirm real values.
 */
export const EXPOSURE_RANGES = {
  crop: { min: 70, max: 962 },
  livestock: { min: 0, max: 5900 },
  population: { min: 0, max: 45 },
} as const;

/**
 * TODO: confirm real values.
 */
export const ADAPTIVE_CAPACITY_RANGES: Record<
  string,
  { min: number; max: number; step?: number }
> = {
  'Education Years': { min: 0, max: 1, step: 0.1 },
  'Health Facility Access': { min: 0, max: 200 },
  'Gender Equity': { min: 0, max: 1, step: 0.1 },
  Wealth: { min: 0, max: 100 },
  'Banking Access': { min: 0, max: 0.9, step: 0.1 },
  'Mobile Broadband': { min: 0, max: 50 },
  'Market Access': { min: 0, max: 300 },
};

export const SIDEBAR_SECTIONS = [
  { id: 'geography', label: 'GEOGRAPHY' },
  { id: 'hazards', label: 'CLIMATE HAZARDS' },
  { id: 'exposure', label: 'EXPOSURE' },
  { id: 'capacity', label: 'ADAPTIVE CAPACITY' },
  { id: 'attachments', label: 'ATTACHMENTS' },
] as const;
