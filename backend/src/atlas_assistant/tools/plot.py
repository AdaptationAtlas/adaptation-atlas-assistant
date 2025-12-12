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
    ChartType,
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

1. Identifying the column containing ISO3 country codes \
(3-letter codes like 'KEN', 'NGA', 'ZAF', 'ETH')
2. Identifying the numeric column to use for coloring the map
3. Creating a descriptive title
4. Optionally suggesting a color scheme (default is "Oranges")

Data to visualize:

```json
{data}
```

You must respond with a JSON object matching this schema:

```json
{json.dumps(MapChartMetadata.model_json_schema(), indent=2)}
```

Notes:
- The id_column should contain ISO3 country codes
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


# Registry mapping chart types to their metadata class and prompt function.
# To add a new chart type:
# 1. Add the metadata class to state.py
# 2. Add the prompt function above
# 3. Add an entry to this registry
CHART_REGISTRY: dict[ChartType, tuple[type[BaseModel], PromptFunc]] = {
    "bar": (BarChartMetadata, _get_bar_chart_metadata_prompt),
    "map": (MapChartMetadata, _get_map_chart_metadata_prompt),
    "area": (AreaChartMetadata, _get_area_chart_metadata_prompt),
}


@tool
def generate_chart_metadata(
    chart_type: ChartType, runtime: ToolRuntime[Context, State]
) -> Command[None]:
    """Generates metadata to use when creating a chart visualization.

    Use this tool after generate_table has returned data. Choose the appropriate
    chart_type based on the data and user's request:

    - "bar": For comparing categorical data. Best when showing values across
      categories (countries, crops, scenarios).
    - "map": For geographic/choropleth visualization. Use when data contains
      ISO3 country codes and you want to show values on a map.
    - "area": For time series or sequential data with stacked categories.
      Best for showing how parts contribute to a whole over time.

    Args:
        chart_type: The type of chart to generate metadata for.
            Must be one of: "bar", "map", "area"
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
