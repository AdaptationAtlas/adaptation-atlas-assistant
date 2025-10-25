"""
https://github.com/e2b-dev/e2b-cookbook/blob/main/examples/codestral-code-interpreter-python/codestral_code_interpreter.ipynb
"""

import io
import json
import re
from typing import Annotated, Literal

import duckdb
import pandas as pd
import plotly.express as px
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool
from langchain_core.tools.base import InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel, Field

from ..settings import get_settings
from ..state import AgentState


class SQLQuery(BaseModel):
    """Structured output for SQL query generation."""

    sql_query: str
    explanation: str


class PlotlyPlot(BaseModel):
    """Structured output for Plotly plot generation."""

    python_code: Annotated[
        str, Field(description="The Python code to create the plotly express plot")
    ]
    explanation: str


class PlotlyPlotArgs(BaseModel):
    """Structured output for Plotly plot arguments generation."""

    plotly_express_args: Annotated[
        dict, Field(description="The arguments for the plotly express plot")
    ]
    plot_type: Literal[
        "bar",
        "line",
        "scatter",
        "histogram",
        "box",
        "violin",
        "area",
        "pie",
    ]
    explanation: str


GET_DATA_PROMPT = """You're a python data scientist that is analyzing datasets.

You will write SQL code to extract and simplify data from a larger dataset.

The SQL code will be executed using duckdb database.

The dataset is in a parquet file in S3. here is the info about the dataset

{dataset_info}

Here is a csv of the head of the dataset:

```csv
{data_sample}
```

Instructions:
- Generate executable SQL code to extract the requested data
- Always use the S3 path to read the parquet file in the sql code you write
- Provide a brief explanation of what the query does
- Nicely indent the SQL code with 2 spaces
"""

MAKE_PLOT_PROMPT_CODE = """You're a data scientist that is analyzing datasets using plotly express.

You will generate Python code that creates a plotly express plot.

Here is the head of the data as csv:

```csv
{chart_data}
```

Example Python code for creating a plot:

```python
import plotly.express as px
fig = px.bar(data, x="category", y="value", title="Bar Chart")
fig.show()
```

Instructions:
- Generate Python code that creates a plotly express plot
- Use the data structure to decide what plot type to use and pick the right arguments
- The data is in the chart_data variable locally
- Include import statements and fig.show() at the end
- Provide a brief explanation of the visualization

IMPORTANT: do not include any data manipulation code, only the plot code for the chart_data variable as-is
"""


MAKE_PLOT_PROMPT_ARGS = """You're a data scientist that is analyzing datasets using plotly express.

You will generate plotly express plot arguments and plot type.

Here is the head of the data as csv:

```csv
{chart_data}
```

Example plotly express plot arguments:

```json
{{
    "x": "category",
    "y": "value",
    "title": "Bar Chart"
}}
```

Instructions:
- Return only the json object with the plotly express arguments
- Use data structure to decide what plot type to use and pick the right arguments
- Specify the plot type you're creating
- Provide a brief explanation of the visualization
"""


def extract_code_from_response(content: str) -> str:
    """Extract Python code from LLM response."""
    # Try to find markdown code blocks first
    code_pattern = r"```(?:python|sql)?\n(.*?)```"
    matches = re.findall(code_pattern, content, re.DOTALL)

    if matches:
        return matches[0].strip()

    # If no code blocks, return cleaned content
    return content.strip()


@tool("create_chart_tool")
async def create_chart(
    plot_query: str,
    tool_call_id: Annotated[str, InjectedToolCallId],
    state: Annotated[AgentState, InjectedState] = None,
) -> Command:
    """Create a plot from the list of available datasets.

    Updates the `plot` state with the details of the best matching plot if found,
    """
    print(f"Creating plot for query: {plot_query}")
    if not state.dataset:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="No dataset selected", tool_call_id=tool_call_id
                    )
                ]
            }
        )
    s3_path = state.dataset["s3"]
    conn = duckdb.connect()
    sql_to_extract_metadata = f"""SELECT * FROM '{s3_path}' LIMIT 5"""
    result = conn.execute(sql_to_extract_metadata)

    column_names = [desc[0] for desc in result.description]
    data_rows = result.fetchall()
    data_sample = pd.DataFrame(data_rows, columns=column_names)
    conn.close()

    settings = get_settings()

    client = Mistral(api_key=settings.mistral_api_key.get_secret_value())
    response = client.chat.parse(
        model="codestral-latest",
        messages=[
            {
                "role": "system",
                "content": GET_DATA_PROMPT.format(
                    dataset_info=json.dumps(state.dataset),
                    data_sample=data_sample.to_string(index=False),
                ),
            },
            {"role": "user", "content": plot_query},
        ],
        response_format=SQLQuery,
    )
    sql_result = response.choices[0].message.parsed
    duckdb_sql = sql_result.sql_query
    print(f"SQL Query Explanation: {sql_result.explanation}")

    print("DUCKDB CODE: \n", duckdb_sql)

    conn = duckdb.connect()
    result = conn.execute(duckdb_sql)

    column_names = [desc[0] for desc in result.description]
    data_rows = result.fetchall()
    chart_data = pd.DataFrame(data_rows, columns=column_names)
    conn.close()
    chart_data = chart_data.dropna()

    response = client.chat.parse(
        model="codestral-latest",
        messages=[
            {
                "role": "system",
                "content": MAKE_PLOT_PROMPT_CODE.format(
                    chart_data=chart_data.head(5).to_csv(index=False),
                ),
            },
            {"role": "user", "content": plot_query},
        ],
        response_format=PlotlyPlot,
    )
    plot_result = response.choices[0].message.parsed
    python_code = plot_result.python_code
    print(f"Python Code Explanation: {plot_result.explanation}")
    print("PYTHON CODE: \n", python_code)

    # Extract px function calls and arguments
    px_pattern = r"px\.(\w+)\s*\(\s*([^)]*)\s*\)"
    px_matches = re.findall(px_pattern, python_code)

    px_calls = []
    for function_name, args_str in px_matches:
        print(f"Plotly Express function: {function_name}")
        print(f"Arguments: {args_str}")
        args_dict = {}

        # Remove common patterns and split by commas
        clean_args = args_str.replace("chart_data", "").replace("data", "").strip()
        if clean_args:
            # Simple key=value parsing
            arg_pairs = re.findall(r"(\w+)\s*=\s*([^,]+)", clean_args)
            for key, value in arg_pairs:
                # Clean up the value
                value = value.strip().strip("\"'")
                args_dict[key] = value
            print(f"Parsed arguments: {args_dict}")
            px_calls.append({"function_name": function_name, "args": args_dict})

    for px_call in px_calls:
        fig = getattr(px, px_call["function_name"])(chart_data, **px_call["args"])

    with io.StringIO() as buffer:
        fig.write_json(buffer)
        chart_json = buffer.getvalue()

    return Command(
        update={
            "chart_data": chart_data.to_dict(),
            "chart": json.loads(chart_json),
            "chart_query": duckdb_sql,
            "python_code": python_code,
            "messages": [
                ToolMessage(
                    content=(
                        f"Created chart with explanation: {plot_result.explanation}"
                    ),
                    tool_call_id=tool_call_id,
                )
            ],
        },
    )
