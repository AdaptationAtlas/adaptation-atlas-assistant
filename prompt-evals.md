# Adaptation Atlas Co-Pilot - Prompt Evaluations

This document contains evaluation prompts derived from Observable notebook analyses, filtered by available datasets.

## Available Datasets

1. **Administrative Boundaries (Africa, GAUL 2024)** - Admin 0/1/2 boundaries
2. **Agricultural Exposure Dataset** - Crop production (tonnes), harvested area (ha), livestock numbers, production value (USD) - MAPSPAM 2020 & GLW4
3. **Historical Climate Hazard Exposure for Crops and Livestock** - VOP exposed to individual/compound hazards (drought, heat, wet)
4. **Future Climate Hazard Exposure for Crops and Livestock** - VOP exposed to hazards across 4 scenarios (SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5) and 4 time periods (2030, 2050, 2070, 2080)

---

## Prompts by Category

### Agricultural Exposure Analysis

These prompts explore crop production, harvested areas, livestock distribution, and production values.

| ID | Prompt | Expected Output | Source Notebook |
|----|--------|-----------------|-----------------|
| AE-01 | What is the total crop production value in USD for Ethiopia? | Bar chart or summary showing production value by crop | Explore the Datasets |
| AE-02 | Show me the top 10 countries in Africa by total agricultural production value | Ranked bar chart | Evaluate Climate Risks |
| AE-03 | Compare harvested area for maize across East African countries | Grouped bar chart by country | Explore the Datasets |
| AE-04 | What is the livestock distribution (by headcount) in Kenya? | Bar chart showing livestock types | Explore the Datasets |
| AE-05 | Which admin-1 regions in Nigeria have the highest crop production in tonnes? | Ranked bar chart by region | Explore the Datasets |
| AE-06 | Show the distribution of agricultural production value across admin-2 districts in Tanzania | Choropleth-style data or ranked list | Evaluate Climate Risks |
| AE-07 | What crops have the largest harvested area in West Africa? | Bar chart by crop type | Explore the Datasets |
| AE-08 | Compare total livestock numbers between cattle, goats, and sheep in the Sahel region | Grouped bar chart | Explore the Datasets |
| AE-09 | What is the total production value of cereals vs legumes in Sub-Saharan Africa? | Comparison bar chart | Explore the Datasets |
| AE-10 | Show me the top 5 admin-1 regions by rice production in Madagascar | Ranked bar chart | Explore the Datasets |

### Historical Climate Hazard Exposure

These prompts examine historical exposure of crops and livestock to climate hazards.

| ID | Prompt | Expected Output | Source Notebook |
|----|--------|-----------------|-----------------|
| HH-01 | What is the value of crop production exposed to drought historically in Ethiopia? | Summary statistic or bar chart | Evaluate Climate Risks |
| HH-02 | Which countries have the highest historical exposure to heat hazards for livestock? | Ranked bar chart | Evaluate Climate Risks |
| HH-03 | Compare historical exposure to dry vs wet hazards for crops in Kenya | Grouped bar chart | Evaluate Climate Risks |
| HH-04 | Show the breakdown of compound hazard exposure for agriculture in West Africa | Stacked bar chart | Evaluate Climate Risks |
| HH-05 | What crops are most exposed to historical heat stress in terms of VOP? | Ranked bar chart by crop | Climate Rationale |
| HH-06 | Which livestock types face the greatest historical drought exposure in the Sahel? | Bar chart by livestock type | Evaluate Climate Risks |
| HH-07 | Compare historical compound hazard exposure between East and Southern Africa | Grouped bar chart by region | Evaluate Climate Risks |
| HH-08 | What is the total VOP exposed to any climate hazard historically in Nigeria? | Summary with breakdown | Evaluate Climate Risks |
| HH-09 | Show me which admin-1 regions in Uganda have highest agricultural exposure to heat hazards | Ranked list or bar chart | Evaluate Climate Risks |
| HH-10 | What percentage of agricultural VOP is exposed to compound hazards in Zambia? | Percentage summary | Evaluate Climate Risks |

### Future Climate Hazard Exposure

These prompts examine projected future exposure under different scenarios and time periods.

| ID | Prompt | Expected Output | Source Notebook |
|----|--------|-----------------|-----------------|
| FH-01 | How does crop exposure to drought change from historical to 2050 under SSP2-4.5 in Kenya? | Comparison bar chart (historical vs future) | Climate Rationale |
| FH-02 | Compare heat hazard exposure for livestock in 2030 vs 2050 under SSP5-8.5 | Time series or grouped bar | Climate Rationale |
| FH-03 | Which scenario shows the highest agricultural exposure to hazards by 2080? | Comparison across scenarios | Climate Rationale |
| FH-04 | Show future exposure to compound hazards for crops in Ethiopia across all time periods | Line chart or grouped bar by timeframe | Evaluate Climate Risks |
| FH-05 | What is the projected VOP exposed to heat hazards in West Africa by 2050 under SSP3-7.0? | Summary statistic with context | Climate Rationale |
| FH-06 | Compare future drought exposure between SSP1-2.6 and SSP5-8.5 for Tanzania | Side-by-side comparison | Climate Rationale |
| FH-07 | How does livestock exposure to wet hazards change over time in the Sahel? | Time series chart | Climate Rationale |
| FH-08 | Which crops face the greatest increase in hazard exposure from historical to 2050? | Change analysis chart | Climate Rationale |
| FH-09 | Show the distribution of future compound hazard exposure across admin-1 regions in Nigeria | Ranked bar chart | Evaluate Climate Risks |
| FH-10 | What is the projected total agricultural VOP at risk in 2080 under the worst-case scenario? | Summary with breakdown | Climate Rationale |

### Comparative Analysis (Cross-Cutting)

These prompts combine multiple datasets for comparative analysis.

| ID | Prompt | Expected Output | Source Notebook |
|----|--------|-----------------|-----------------|
| CA-01 | For countries with highest crop production, what is their hazard exposure profile? | Multi-variable comparison | Evaluate Climate Risks |
| CA-02 | Compare historical vs future (2050) hazard exposure for the top 5 maize producing countries | Before/after comparison | Climate Rationale |
| CA-03 | Which regions have high agricultural value AND high compound hazard exposure? | Intersection analysis | Evaluate Climate Risks |
| CA-04 | Show the relationship between livestock numbers and historical heat exposure by country | Scatter plot or correlation | Evaluate Climate Risks |
| CA-05 | How does crop production value correlate with future climate risk in East Africa? | Correlation analysis | Evaluate Climate Risks |
| CA-06 | Compare the hazard exposure profile of Ethiopia vs Kenya across all hazard types | Side-by-side comparison | Evaluate Climate Risks |
| CA-07 | Which admin-1 regions have the greatest gap between production value and hazard exposure? | Gap analysis | Evaluate Climate Risks |
| CA-08 | Show historical to 2050 change in hazard exposure for the most agriculturally productive regions | Change over time analysis | Climate Rationale |
| CA-09 | What percentage of total African agricultural VOP is exposed to hazards under different scenarios? | Scenario comparison summary | Climate Rationale |
| CA-10 | Compare the top 10 livestock-producing countries by their exposure to multiple hazard types | Multi-hazard comparison | Prioritize Livestock |

### Geographic Queries

These prompts focus on spatial filtering and regional analysis.

| ID | Prompt | Expected Output | Source Notebook |
|----|--------|-----------------|-----------------|
| GQ-01 | What is the agricultural profile of the Greater Horn of Africa? | Regional summary | Explore the Datasets |
| GQ-02 | Show all admin-2 districts in Ethiopia with their crop production values | Table or map-ready data | Explore the Datasets |
| GQ-03 | Compare agricultural exposure between coastal and inland regions of Kenya | Regional comparison | Explore the Datasets |
| GQ-04 | What are the top producing admin-1 regions across all of Southern Africa? | Ranked regional list | Explore the Datasets |
| GQ-05 | Show climate hazard exposure for countries in the Congo Basin | Regional hazard summary | Evaluate Climate Risks |

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

| Category | Total Prompts | Prompts Supported |
|----------|---------------|-------------------|
| Agricultural Exposure | 10 | 10 |
| Historical Hazard Exposure | 10 | 10 |
| Future Hazard Exposure | 10 | 10 |
| Comparative Analysis | 10 | 10 |
| Geographic Queries | 5 | 5 |
| **Total** | **45** | **45** |

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
