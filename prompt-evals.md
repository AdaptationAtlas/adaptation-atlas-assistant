# Adaptation Atlas Co-Pilot - Prompt Evaluations

This document contains evaluation prompts derived from Observable notebook analyses, filtered by available datasets.

## Available Datasets

1. **Administrative Boundaries (Africa, GAUL 2024)** - Admin 0/1/2 boundaries
2. **Agricultural Exposure Dataset** - Crop production (tonnes), harvested area (ha), livestock numbers, production value (USD) - MAPSPAM 2020 & GLW4
3. **Historical Climate Hazard Exposure for Crops and Livestock** - VOP exposed to individual/compound hazards (drought, heat, wet)
4. **Future Climate Hazard Exposure for Crops and Livestock** - VOP exposed to hazards across 4 scenarios (SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5) and 4 time periods (2030, 2050, 2070, 2080)

---

## Evaluation Prompts

### Bar Charts

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| BC-01 | Create a bar chart showing the top 10 countries in Africa by total agricultural production value | Evaluate Climate Risks |
| BC-02 | Create a bar chart showing livestock distribution by headcount in Kenya | Explore the Datasets |
| BC-03 | Create a bar chart comparing historical exposure to dry vs wet hazards for crops in Kenya | Evaluate Climate Risks |
| BC-04 | Create a bar chart showing crops most exposed to historical heat stress in terms of VOP | Climate Rationale |
| BC-05 | Create a bar chart comparing future drought exposure between SSP1-2.6 and SSP5-8.5 for Tanzania | Climate Rationale |
| BC-06 | Create a bar chart showing how livestock exposure to wet hazards changes over time in the Sahel | Climate Rationale |
| BC-07 | Create a bar chart comparing hazard exposure profile of Ethiopia vs Kenya across all hazard types | Evaluate Climate Risks |
| BC-08 | Create a bar chart showing breakdown of hazard exposure by type for crops in Ethiopia | Evaluate Climate Risks |

### Scatter Plots

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| SP-01 | Create a scatter plot showing relationship between livestock numbers and historical heat exposure by country | Evaluate Climate Risks |
| SP-02 | Create a scatter plot showing how crop production value correlates with future climate risk in East Africa | Evaluate Climate Risks |
| SP-03 | Create a scatter plot showing relationship between agricultural production and compound hazard exposure across African countries | Climate Rationale |

### Heatmaps

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| HM-01 | Create a heatmap showing crop exposure to each hazard type across East African countries | Climate Rationale |
| HM-02 | Create a heatmap showing livestock types vs hazard exposure in the Sahel | Climate Rationale |
| HM-03 | Create a heatmap showing SSP scenarios vs time periods for maize drought exposure in Kenya | Climate Rationale |
| HM-04 | Create a heatmap showing hazard exposure intensity for all crops across admin-1 regions in Ethiopia | Climate Rationale |
| HM-05 | Create a heatmap comparing historical and future compound hazard exposure across major African regions | Climate Rationale |

### Dot Plots

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| DP-01 | Create a dot plot comparing crop production values across all crops in Tanzania | Evaluate Climate Risks |
| DP-02 | Create a dot plot showing drought exposure for each crop in Kenya | Evaluate Climate Risks |
| DP-03 | Create a dot plot showing livestock counts by type across Sahel countries | Evaluate Climate Risks |
| DP-04 | Create a dot plot comparing future hazard exposure (2050) across scenarios for maize in Ethiopia | Climate Rationale |
| DP-05 | Create a dot plot showing crop production values across admin-1 regions in Nigeria | Explore the Datasets |

### Beeswarm Plots

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| BS-01 | Create a beeswarm plot showing distribution of crop production values across all admin-2 districts in Kenya | Explore the Datasets |
| BS-02 | Create a beeswarm plot showing historical drought exposure distribution for all crops across African countries | Evaluate Climate Risks |
| BS-03 | Create a beeswarm plot showing distribution of future heat exposure values across all admin-2 regions in Tanzania | Climate Rationale |

### Tables & Summaries

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| TS-01 | What is the agricultural profile of the Greater Horn of Africa? | Explore the Datasets |
| TS-02 | Show all admin-2 districts in Ethiopia with their crop production values as a table | Explore the Datasets |

### Geographic Queries - Admin 0 (Country-level)

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| GQ-01 | What is the agricultural profile of Kenya? | Explore the Datasets |
| GQ-02 | What crops are grown in Ethiopia and what is their total value of production? | Explore the Datasets |
| GQ-03 | Compare climate hazard exposure between Kenya and Tanzania | Evaluate Climate Risks |
| GQ-04 | Which African countries have the highest livestock populations? | Explore the Datasets |
| GQ-05 | Show the drought exposure for all crops in Nigeria | Evaluate Climate Risks |
| GQ-06 | What is the breakdown of agricultural production by crop type in Uganda? | Explore the Datasets |
| GQ-07 | Compare future climate risks between Ghana and Senegal under SSP5-8.5 | Climate Rationale |
| GQ-08 | What are the main climate hazards affecting agriculture in Malawi? | Evaluate Climate Risks |

### Geographic Queries - Regional

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| GQ-09 | What is the agricultural profile of the Greater Horn of Africa? | Explore the Datasets |
| GQ-10 | Compare agricultural exposure between coastal and inland regions of Kenya | Evaluate Climate Risks |
| GQ-11 | What are the top producing admin-1 regions across all of Southern Africa? | Explore the Datasets |
| GQ-12 | Show climate hazard exposure for countries in the Congo Basin | Evaluate Climate Risks |
| GQ-13 | Compare crop production across East African Community member countries | Explore the Datasets |
| GQ-14 | What is the livestock distribution across Sahel countries? | Explore the Datasets |
| GQ-15 | Show all admin-2 districts in Ethiopia with their crop production values | Explore the Datasets |

### Maps

| ID | Prompt | Source Notebook |
|----|--------|-----------------|
| MAP-01 | Create a map showing agricultural production value across all African countries | Explore the Datasets |
| MAP-02 | Create a map showing drought exposure by admin-1 region in Kenya | Evaluate Climate Risks |
| MAP-03 | Create a map showing crop production distribution across admin-2 districts in Ethiopia | Explore the Datasets |
| MAP-04 | Create a map showing livestock density across East African countries | Explore the Datasets |
| MAP-05 | Create a map showing future heat stress exposure (2050) across the Sahel region | Climate Rationale |
| MAP-06 | Create a map showing maize production value by admin-1 region in Tanzania | Explore the Datasets |

---

## Prompts NOT Supported by Current Datasets

The following types of analyses from the Observable notebooks require datasets not currently available:

### Requires Vulnerability/Socioeconomic Data (Not Available)
- Poverty rate analysis
- Education attainment metrics
- Female empowerment indices
- Adaptive capacity assessments
- Rural vs urban population breakdowns

### Requires Climate Solutions/Interventions Data (Not Available)
- Agricultural practice effectiveness
- Yield impact of adaptation measures
- Adoption barrier analysis
- Solutions matching by crop/region

### Requires Economic Modeling Data (Not Available)
- Return on investment calculations
- NPV/IRR projections
- Benefit-cost ratios

### Requires Detailed Climate Variables (Not Available)
- Warming stripes visualizations
- Temperature/precipitation anomalies
- WBGT (Wet Bulb Globe Temperature) metrics
- Working hours lost to heat stress

### Requires Yield Projection Data (Not Available)
- Crop suitability changes
- Yield projections at warming levels
- Adaptation effectiveness on yields

---

## Summary Statistics

| Chart Type | Count |
|------------|-------|
| Bar Charts | 8 |
| Scatter Plots | 3 |
| Heatmaps | 5 |
| Dot Plots | 5 |
| Beeswarm Plots | 3 |
| Tables & Summaries | 2 |
| Geographic Queries | 15 |
| Maps | 6 |
| **Total** | **47** |

## Observable Notebooks Analyzed

1. [Explore the Datasets](https://observablehq.com/d/4376f4ef36b430d2) - General data exploration
2. [Climate Rationale](https://observablehq.com/d/121ced9e71e73dbc) - Evidence for climate projects
3. [Evaluate Climate Risks](https://observablehq.com/d/d8c0692154e6c87e) - Risk assessment tool
4. [Discover Solutions](https://observablehq.com/d/7539fd16f4fc40e3) - Adaptation practices (data not available)
5. [Economic Returns](https://observablehq.com/d/e50553b7ea6f9c17) - Investment analysis (data not available)
6. [Women's Climate Vulnerability](https://observablehq.com/@adaptationatlas/african-womens-climate-vulnerability-and-capacity) - Gender analysis (data not available)
7. [Heat Stress on Producers](https://observablehq.com/d/885622eda8a5afae) - Worker heat exposure (data not available)
8. [Prioritize Livestock](https://observablehq.com/d/9ca8f47f84c8d475) - Livestock investment priorities
9. [Climate Impacts and Adaptation](https://observablehq.com/d/4c65e6dd0bfc32a5) - Yield projections (data not available)
