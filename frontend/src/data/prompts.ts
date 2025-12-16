// Evaluation prompts derived from Observable notebook analyses
// See prompt-evals.md for full documentation

export interface Prompt {
    id: string;
    text: string; // Base text WITHOUT chart type prefix
    category: string;
    chartType?: string; // e.g., "bar chart", "scatter plot", "heatmap"
    verb?: string; // e.g., "showing", "comparing" (default: "showing")
}

export const PROMPTS: Prompt[] = [
    // Bar Charts
    {
        id: 'BC-01',
        text: 'the top 10 countries in Africa by total agricultural production value',
        category: 'Bar Charts',
        chartType: 'bar chart',
    },
    {
        id: 'BC-02',
        text: 'livestock distribution by headcount in Kenya',
        category: 'Bar Charts',
        chartType: 'bar chart',
    },
    {
        id: 'BC-03',
        text: 'historical exposure to dry vs wet hazards for crops in Kenya',
        category: 'Bar Charts',
        chartType: 'bar chart',
        verb: 'comparing',
    },
    {
        id: 'BC-04',
        text: 'crops most exposed to historical heat stress in terms of VOP',
        category: 'Bar Charts',
        chartType: 'bar chart',
    },
    {
        id: 'BC-05',
        text: 'future drought exposure between SSP1-2.6 and SSP5-8.5 for Tanzania',
        category: 'Bar Charts',
        chartType: 'bar chart',
        verb: 'comparing',
    },
    {
        id: 'BC-06',
        text: 'how livestock exposure to wet hazards changes over time in the Sahel',
        category: 'Bar Charts',
        chartType: 'bar chart',
    },
    {
        id: 'BC-07',
        text: 'hazard exposure profile of Ethiopia vs Kenya across all hazard types',
        category: 'Bar Charts',
        chartType: 'bar chart',
        verb: 'comparing',
    },
    {
        id: 'BC-08',
        text: 'breakdown of hazard exposure by type for crops in Ethiopia',
        category: 'Bar Charts',
        chartType: 'bar chart',
    },

    // Scatter Plots
    {
        id: 'SP-01',
        text: 'relationship between livestock numbers and historical heat exposure by country',
        category: 'Scatter Plots',
        chartType: 'scatter plot',
    },
    {
        id: 'SP-02',
        text: 'how crop production value correlates with future climate risk in East Africa',
        category: 'Scatter Plots',
        chartType: 'scatter plot',
    },
    {
        id: 'SP-03',
        text: 'relationship between agricultural production and compound hazard exposure across African countries',
        category: 'Scatter Plots',
        chartType: 'scatter plot',
    },

    // Heatmaps
    {
        id: 'HM-01',
        text: 'crop exposure to each hazard type across East African countries',
        category: 'Heatmaps',
        chartType: 'heatmap',
    },
    {
        id: 'HM-02',
        text: 'livestock types vs hazard exposure in the Sahel',
        category: 'Heatmaps',
        chartType: 'heatmap',
    },
    {
        id: 'HM-03',
        text: 'SSP scenarios vs time periods for maize drought exposure in Kenya',
        category: 'Heatmaps',
        chartType: 'heatmap',
    },
    {
        id: 'HM-04',
        text: 'hazard exposure intensity for all crops across admin-1 regions in Ethiopia',
        category: 'Heatmaps',
        chartType: 'heatmap',
    },
    {
        id: 'HM-05',
        text: 'historical and future compound hazard exposure across major African regions',
        category: 'Heatmaps',
        chartType: 'heatmap',
        verb: 'comparing',
    },

    // Dot Plots
    {
        id: 'DP-01',
        text: 'crop production values across all crops in Tanzania',
        category: 'Dot Plots',
        chartType: 'dot plot',
        verb: 'comparing',
    },
    {
        id: 'DP-02',
        text: 'drought exposure for each crop in Kenya',
        category: 'Dot Plots',
        chartType: 'dot plot',
    },
    {
        id: 'DP-03',
        text: 'livestock counts by type across Sahel countries',
        category: 'Dot Plots',
        chartType: 'dot plot',
    },
    {
        id: 'DP-04',
        text: 'future hazard exposure (2050) across scenarios for maize in Ethiopia',
        category: 'Dot Plots',
        chartType: 'dot plot',
        verb: 'comparing',
    },
    {
        id: 'DP-05',
        text: 'crop production values across admin-1 regions in Nigeria',
        category: 'Dot Plots',
        chartType: 'dot plot',
    },

    // Beeswarm Plots
    {
        id: 'BS-01',
        text: 'distribution of crop production values across all admin-2 districts in Kenya',
        category: 'Beeswarm Plots',
        chartType: 'beeswarm plot',
    },
    {
        id: 'BS-02',
        text: 'historical drought exposure distribution for all crops across African countries',
        category: 'Beeswarm Plots',
        chartType: 'beeswarm plot',
    },
    {
        id: 'BS-03',
        text: 'distribution of future heat exposure values across all admin-2 regions in Tanzania',
        category: 'Beeswarm Plots',
        chartType: 'beeswarm plot',
    },

    // Tables & Summaries (no chart type)
    {
        id: 'TS-01',
        text: 'What is the agricultural profile of the Greater Horn of Africa?',
        category: 'Tables & Summaries',
    },
    {
        id: 'TS-02',
        text: 'Show all admin-2 districts in Ethiopia with their crop production values as a table',
        category: 'Tables & Summaries',
    },

    // Geographic Queries - Admin 0 (Country-level)
    {
        id: 'GQ-01',
        text: 'What is the agricultural profile of Kenya?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-02',
        text: 'What crops are grown in Ethiopia and what is their total value of production?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-03',
        text: 'Compare climate hazard exposure between Kenya and Tanzania',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-04',
        text: 'Which African countries have the highest livestock populations?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-05',
        text: 'Show the drought exposure for all crops in Nigeria',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-06',
        text: 'What is the breakdown of agricultural production by crop type in Uganda?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-07',
        text: 'Compare future climate risks between Ghana and Senegal under SSP5-8.5',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-08',
        text: 'What are the main climate hazards affecting agriculture in Malawi?',
        category: 'Geographic Queries',
    },

    // Geographic Queries - Regional
    {
        id: 'GQ-09',
        text: 'What is the agricultural profile of the Greater Horn of Africa?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-10',
        text: 'Compare agricultural exposure between coastal and inland regions of Kenya',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-11',
        text: 'What are the top producing admin-1 regions across all of Southern Africa?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-12',
        text: 'Show climate hazard exposure for countries in the Congo Basin',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-13',
        text: 'Compare crop production across East African Community member countries',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-14',
        text: 'What is the livestock distribution across Sahel countries?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-15',
        text: 'Show all admin-2 districts in Ethiopia with their crop production values',
        category: 'Geographic Queries',
    },

    // Maps
    {
        id: 'MAP-01',
        text: 'agricultural production value across all African countries',
        category: 'Maps',
        chartType: 'map',
    },
    {
        id: 'MAP-02',
        text: 'drought exposure by admin-1 region in Kenya',
        category: 'Maps',
        chartType: 'map',
    },
    {
        id: 'MAP-03',
        text: 'crop production distribution across admin-2 districts in Ethiopia',
        category: 'Maps',
        chartType: 'map',
    },
    {
        id: 'MAP-04',
        text: 'livestock density across East African countries',
        category: 'Maps',
        chartType: 'map',
    },
    {
        id: 'MAP-05',
        text: 'future heat stress exposure (2050) across the Sahel region',
        category: 'Maps',
        chartType: 'map',
    },
    {
        id: 'MAP-06',
        text: 'maize production value by admin-1 region in Tanzania',
        category: 'Maps',
        chartType: 'map',
    },
];

/**
 * Check if chart type hints should be included based on URL parameter
 */
function shouldIncludeChartType(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('chartHints') === 'true';
}

/**
 * Get the display text for a prompt, optionally including the chart type
 * @param prompt The prompt object
 * @param includeChartType Whether to include the chart type prefix (default: based on URL param)
 */
export function getPromptDisplayText(
    prompt: Prompt,
    includeChartType?: boolean
): string {
    const shouldInclude = includeChartType ?? shouldIncludeChartType();

    if (!shouldInclude || !prompt.chartType) {
        // For prompts with chartType, capitalize first letter
        if (prompt.chartType) {
            return prompt.text.charAt(0).toUpperCase() + prompt.text.slice(1);
        }
        return prompt.text;
    }

    const verb = prompt.verb ?? 'showing';
    return `Create a ${prompt.chartType} ${verb} ${prompt.text}`;
}

/**
 * Get a random selection of prompts
 * @param count Number of prompts to return (default: 3)
 * @returns Array of randomly selected prompts
 */
export function getRandomPrompts(count: number = 3): Prompt[] {
    const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Get prompts by category
 * @param category The category to filter by
 * @returns Array of prompts in that category
 */
export function getPromptsByCategory(category: string): Prompt[] {
    return PROMPTS.filter((p) => p.category === category);
}

/**
 * Get all unique categories
 * @returns Array of category names
 */
export function getCategories(): string[] {
    return [...new Set(PROMPTS.map((p) => p.category))];
}
