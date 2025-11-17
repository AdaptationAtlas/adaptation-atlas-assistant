import json

from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral

from ..context import Context
from ..state import BarChartMetadata, State


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
                    artifact=bar_chart_metadata,
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
