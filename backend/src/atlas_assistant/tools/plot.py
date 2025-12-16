import json
from collections.abc import Callable

from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel

from ..context import Context
from ..state import (
    AreaChartMetadata,
    BarChartMetadata,
    BeeswarmChartMetadata,
    ChartType,
    DotPlotMetadata,
    HeatmapChartMetadata,
    LineChartMetadata,
    MapChartMetadata,
    State,
)

# Type alias for prompt functions
PromptFunc = Callable[[str], str]


def _get_bar_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create bar chart by:

1. Identifying the best categorical field for the X-axis
2. Identifying a numeric fields for the Y-axis
3. Creating a descriptive title
4. Optionally identifying a column that should be used for grouping

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(BarChartMetadata.model_json_schema(), indent=2)}
```
"""


def _get_map_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization, specifically \
geographic/choropleth maps.

Your task is to analyze the following data and create a choropleth map by:

1. Determining the administrative level based on the data columns:
   - admin0 (country): if data has iso3/country codes but NOT admin1_name
   - admin1 (state/province): if data has admin1_name column with values
   - admin2 (district): if data has admin2_name column with values
2. Identifying the id_column based on admin level:
   - admin0: use the ISO3 country code column (e.g., 'iso3')
   - admin1: use 'admin1_name'
   - admin2: use 'admin2_name'
3. Identifying the numeric column to use for coloring the map
4. Creating a descriptive title
5. Optionally suggesting a color scheme (default is "Oranges")

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(MapChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- Set admin_level based on the granularity of geographic data present
- id_column must match admin_level (iso3 for admin0, admin1_name for admin1, etc.)
- The value_column should be numeric
- Color schemes: "Oranges", "Blues", "Greens", "Reds", "Purples", "Viridis"
"""


def _get_area_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create a stacked area chart by:

1. Identifying the best sequential/time field for the X-axis (e.g., year, date, time)
2. Identifying a numeric field for the Y-axis (values to be stacked)
3. Creating a descriptive title
4. Optionally identifying a column for grouping into stacked categories

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(AreaChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- The x_column should be a sequential or time-based field (years, dates, etc.)
- The y_column should be numeric
- The grouping_column creates the stacked categories (if present in the data)
"""


def _get_line_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create a line chart by:

1. Identifying the best sequential/time field for the X-axis (e.g., year, date, time)
2. Identifying a numeric field for the Y-axis
3. Creating a descriptive title
4. Optionally identifying a column for grouping into multiple series

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(LineChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- The x_column should be a sequential or time-based field (years, dates, etc.)
- The y_column should be numeric
- The grouping_column creates multiple series lines (if present in the data)
"""


def _get_dot_plot_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create a dot plot (scatter plot) by:

1. Identifying a suitable field for the X-axis (can be categorical or numeric)
2. Identifying a numeric field for the Y-axis
3. Creating a descriptive title
4. Optionally identifying a column for grouping/coloring dots
5. Optionally identifying a column for sizing dots by value

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(DotPlotMetadata.model_json_schema(), indent=2)}
```

Notes:
- The x_column can be categorical or numeric
- The y_column should be numeric
- The grouping_column assigns colors to dots by category (if present in the data)
- The size_column scales dot sizes by numeric value (if present in the data)
- Best for showing relationships between variables or distributions
"""


def _get_beeswarm_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create a beeswarm plot by:

1. Identifying the categorical field for grouping (displayed on x-axis)
2. Identifying the numeric field for values (displayed on y-axis with jitter)
3. Creating a descriptive title
4. Optionally identifying a column for coloring the points

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(BeeswarmChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- The category_column should be categorical (countries, crops, scenarios, etc.)
- The value_column should be numeric
- The color_column can be the same as category_column or a different grouping variable
- Beeswarm plots are best for showing distribution of values within categories
"""


def _get_heatmap_chart_metadata_prompt(data: str) -> str:
    return f"""You are an expert in data visualization.

Your task is to analyze the following data and create a heatmap by:

1. Identifying the categorical field for the X-axis
2. Identifying the categorical field for the Y-axis
3. Identifying the numeric field for cell color intensity
4. Creating a descriptive title
5. Optionally suggesting a color scheme (default is "YlOrRd")

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(HeatmapChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- The x_column and y_column should be categorical (regions, crops, years, etc.)
- The value_column should be numeric
- Color schemes: "YlOrRd", "Reds", "Blues", "Greens", "Purples", "Oranges", "Viridis"
- Heatmaps are best for showing relationships between two categorical variables
  with a numeric value
"""


# Registry mapping chart types to their metadata class and prompt function.
# To add a new chart type:
# 1. Add the metadata class to state.py
# 2. Add the prompt function above
# 3. Add an entry to this registry
CHART_REGISTRY: dict[ChartType, tuple[type[BaseModel], PromptFunc]] = {
    "bar": (BarChartMetadata, _get_bar_chart_metadata_prompt),
    "map": (MapChartMetadata, _get_map_chart_metadata_prompt),
    "area": (AreaChartMetadata, _get_area_chart_metadata_prompt),
    "line": (LineChartMetadata, _get_line_chart_metadata_prompt),
    "dot": (DotPlotMetadata, _get_dot_plot_metadata_prompt),
    "beeswarm": (BeeswarmChartMetadata, _get_beeswarm_chart_metadata_prompt),
    "heatmap": (HeatmapChartMetadata, _get_heatmap_chart_metadata_prompt),
}


@tool
def generate_chart_metadata(
    chart_type: ChartType, runtime: ToolRuntime[Context, State]
) -> Command[None]:
    """Generates chart visualization metadata from queried data.

    Call this ONLY after generate_table has returned data. The chart_type
    should be selected based on the user's query using the chart selection
    guidance in your system instructions.

    Args:
        chart_type: One of "bar", "map", "area", "line", "dot", "beeswarm",
            "heatmap". Selection rules are in your system instructions.
    """
    data = runtime.state.get("data")
    if not data:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="No data have been queried from the dataset",
                        tool_call_id=runtime.tool_call_id,
                    )
                ]
            }
        )

    if chart_type not in CHART_REGISTRY:
        valid_types = ", ".join(f'"{t}"' for t in CHART_REGISTRY)
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Invalid chart_type: {chart_type}. "
                        f"Must be one of: {valid_types}",
                        tool_call_id=runtime.tool_call_id,
                    )
                ]
            }
        )

    metadata_class, prompt_func = CHART_REGISTRY[chart_type]

    settings = runtime.context.settings
    client = Mistral(
        api_key=(
            settings.mistral_api_key.get_secret_value()
            if settings.mistral_api_key
            else None
        )
    )
    response = client.chat.parse(
        model="codestral-latest",
        messages=[
            {
                "role": "system",
                "content": prompt_func(data),
            }
        ],
        response_format=metadata_class,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    parsed = response.choices[0].message.parsed
    assert parsed
    # Cast is safe because we pass the specific metadata_class to response_format
    chart_metadata = parsed  # type: ignore[assignment]

    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=f"{chart_type.capitalize()} chart metadata:\n\n```json\n"
                    + chart_metadata.model_dump_json(indent=2)
                    + "\n```",
                    tool_call_id=runtime.tool_call_id,
                    artifact={
                        "chart_type": chart_type,
                        "chart_metadata": chart_metadata,
                        "data": data,
                    },
                )
            ],
            "chart_type": chart_type,
            "chart_metadata": chart_metadata,
        }
    )
