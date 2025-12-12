// Evaluation prompts derived from Observable notebook analyses
// See prompt-evals.md for full documentation

export interface Prompt {
    id: string;
    text: string;
    category: string;
}

export const PROMPTS: Prompt[] = [
    // Agricultural Exposure Analysis
    {
        id: 'AE-01',
        text: 'What is the total crop production value in USD for Ethiopia?',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-02',
        text: 'Show me the top 10 countries in Africa by total agricultural production value',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-03',
        text: 'Compare harvested area for maize across East African countries',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-04',
        text: 'What is the livestock distribution (by headcount) in Kenya?',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-05',
        text: 'Which admin-1 regions in Nigeria have the highest crop production in tonnes?',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-06',
        text: 'Show the distribution of agricultural production value across admin-2 districts in Tanzania',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-07',
        text: 'What crops have the largest harvested area in West Africa?',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-08',
        text: 'Compare total livestock numbers between cattle, goats, and sheep in the Sahel region',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-09',
        text: 'What is the total production value of cereals vs legumes in Sub-Saharan Africa?',
        category: 'Agricultural Exposure',
    },
    {
        id: 'AE-10',
        text: 'Show me the top 5 admin-1 regions by rice production in Madagascar',
        category: 'Agricultural Exposure',
    },

    // Historical Climate Hazard Exposure
    {
        id: 'HH-01',
        text: 'What is the value of crop production exposed to drought historically in Ethiopia?',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-02',
        text: 'Which countries have the highest historical exposure to heat hazards for livestock?',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-03',
        text: 'Compare historical exposure to dry vs wet hazards for crops in Kenya',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-04',
        text: 'Show the breakdown of compound hazard exposure for agriculture in West Africa',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-05',
        text: 'What crops are most exposed to historical heat stress in terms of VOP?',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-06',
        text: 'Which livestock types face the greatest historical drought exposure in the Sahel?',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-07',
        text: 'Compare historical compound hazard exposure between East and Southern Africa',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-08',
        text: 'What is the total VOP exposed to any climate hazard historically in Nigeria?',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-09',
        text: 'Show me which admin-1 regions in Uganda have highest agricultural exposure to heat hazards',
        category: 'Historical Hazard Exposure',
    },
    {
        id: 'HH-10',
        text: 'What percentage of agricultural VOP is exposed to compound hazards in Zambia?',
        category: 'Historical Hazard Exposure',
    },

    // Future Climate Hazard Exposure
    {
        id: 'FH-01',
        text: 'How does crop exposure to drought change from historical to 2050 under SSP2-4.5 in Kenya?',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-02',
        text: 'Compare heat hazard exposure for livestock in 2030 vs 2050 under SSP5-8.5',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-03',
        text: 'Which scenario shows the highest agricultural exposure to hazards by 2080?',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-04',
        text: 'Show future exposure to compound hazards for crops in Ethiopia across all time periods',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-05',
        text: 'What is the projected VOP exposed to heat hazards in West Africa by 2050 under SSP3-7.0?',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-06',
        text: 'Compare future drought exposure between SSP1-2.6 and SSP5-8.5 for Tanzania',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-07',
        text: 'How does livestock exposure to wet hazards change over time in the Sahel?',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-08',
        text: 'Which crops face the greatest increase in hazard exposure from historical to 2050?',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-09',
        text: 'Show the distribution of future compound hazard exposure across admin-1 regions in Nigeria',
        category: 'Future Hazard Exposure',
    },
    {
        id: 'FH-10',
        text: 'What is the projected total agricultural VOP at risk in 2080 under the worst-case scenario?',
        category: 'Future Hazard Exposure',
    },

    // Comparative Analysis
    {
        id: 'CA-01',
        text: 'For countries with highest crop production, what is their hazard exposure profile?',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-02',
        text: 'Compare historical vs future (2050) hazard exposure for the top 5 maize producing countries',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-03',
        text: 'Which regions have high agricultural value AND high compound hazard exposure?',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-04',
        text: 'Show the relationship between livestock numbers and historical heat exposure by country',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-05',
        text: 'How does crop production value correlate with future climate risk in East Africa?',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-06',
        text: 'Compare the hazard exposure profile of Ethiopia vs Kenya across all hazard types',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-07',
        text: 'Which admin-1 regions have the greatest gap between production value and hazard exposure?',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-08',
        text: 'Show historical to 2050 change in hazard exposure for the most agriculturally productive regions',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-09',
        text: 'What percentage of total African agricultural VOP is exposed to hazards under different scenarios?',
        category: 'Comparative Analysis',
    },
    {
        id: 'CA-10',
        text: 'Compare the top 10 livestock-producing countries by their exposure to multiple hazard types',
        category: 'Comparative Analysis',
    },

    // Geographic Queries
    {
        id: 'GQ-01',
        text: 'What is the agricultural profile of the Greater Horn of Africa?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-02',
        text: 'Show all admin-2 districts in Ethiopia with their crop production values',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-03',
        text: 'Compare agricultural exposure between coastal and inland regions of Kenya',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-04',
        text: 'What are the top producing admin-1 regions across all of Southern Africa?',
        category: 'Geographic Queries',
    },
    {
        id: 'GQ-05',
        text: 'Show climate hazard exposure for countries in the Congo Basin',
        category: 'Geographic Queries',
    },
];

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
