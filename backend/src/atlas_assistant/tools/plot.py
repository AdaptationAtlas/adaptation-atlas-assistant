import json

from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral

from ..context import Context
from ..state import AreaChartMetadata, BarChartMetadata, MapChartMetadata, State


@tool
def generate_bar_chart_metadata(runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Generates metadata to use when creating a bar chart

    Requires that we've generated a table of data first.
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
                "content": get_bar_chart_metadata_prompt(data),
            }
        ],
        response_format=BarChartMetadata,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    bar_chart_metadata = response.choices[0].message.parsed
    assert bar_chart_metadata
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content="Bar chart metadata:\n\n```json\n"
                    + bar_chart_metadata.model_dump_json(indent=2)
                    + "\n```",
                    tool_call_id=runtime.tool_call_id,
                    artifact={
                        "bar_chart_metadata": bar_chart_metadata,
                        "data": data,
                    },
                )
            ],
            "bar_chart_metadata": bar_chart_metadata,
        }
    )


def get_bar_chart_metadata_prompt(data: str) -> str:
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


@tool
def generate_map_chart_metadata(runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Generates metadata to use when creating a choropleth map visualization.

    Use this tool when the user wants to visualize geographic data by country
    (e.g., showing values across African countries). The data must contain
    ISO3 country codes (like 'KEN', 'NGA', 'ZAF').

    Requires that we've generated a table of data first with a column containing
    ISO3 country codes.
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
                "content": get_map_chart_metadata_prompt(data),
            }
        ],
        response_format=MapChartMetadata,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    map_chart_metadata = response.choices[0].message.parsed
    assert map_chart_metadata
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content="Map chart metadata:\n\n```json\n"
                    + map_chart_metadata.model_dump_json(indent=2)
                    + "\n```",
                    tool_call_id=runtime.tool_call_id,
                    artifact={
                        "map_chart_metadata": map_chart_metadata,
                        "data": data,
                    },
                )
            ],
            "map_chart_metadata": map_chart_metadata,
        }
    )


def get_map_chart_metadata_prompt(data: str) -> str:
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


@tool
def generate_area_chart_metadata(runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Generates metadata to use when creating a stacked area chart visualization.

    Use this tool when the user wants to visualize time series or sequential data
    with multiple categories stacked on top of each other. Best for showing how
    parts contribute to a whole over time or across ordered categories.

    Requires that we've generated a table of data first.
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
                "content": get_area_chart_metadata_prompt(data),
            }
        ],
        response_format=AreaChartMetadata,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    area_chart_metadata = response.choices[0].message.parsed
    assert area_chart_metadata
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content="Area chart metadata:\n\n```json\n"
                    + area_chart_metadata.model_dump_json(indent=2)
                    + "\n```",
                    tool_call_id=runtime.tool_call_id,
                    artifact={
                        "area_chart_metadata": area_chart_metadata,
                        "data": data,
                    },
                )
            ],
            "area_chart_metadata": area_chart_metadata,
        }
    )


def get_area_chart_metadata_prompt(data: str) -> str:
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
