import json
import logging
from typing import cast

from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel

from ..context import Context
from ..dataset import Dataset
from ..state import SerializedData, SqlQuery, State

MAX_DATA_FRAME_LENGTH = 50

logger = logging.getLogger(__name__)


class SqlQueryParts(BaseModel):
    select: str
    """The SQL select statement"""

    where: str
    """The SQL where statement"""

    group_by: str | None
    """The SQL group by statement"""

    order_by: str | None
    """The SQL order by statement"""

    limit: str | None
    """The SQL limit statement"""

    explanation: str
    """An explanation of why the model generated this query"""

    def get_query(self, href: str) -> SqlQuery:
        """Gets the full SQL query"""
        parts = [f"SELECT {self.select} FROM '{href}' WHERE {self.where}"]
        if self.group_by:
            parts.append(f"GROUP BY {self.group_by}")
        if self.order_by:
            parts.append(f"ORDER BY {self.order_by}")
        if self.limit:
            parts.append(f"LIMIT {self.limit}")
        return SqlQuery(query=" ".join(parts), explanation=self.explanation)


@tool
def generate_sql(query: str, runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Generates SQL to query a dataset.

    There must be a selected dataset to generate SQL.

    Args:
        query: The question that we're going to answer with an SQL query.
    """
    dataset = runtime.state["dataset"]
    if not dataset:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="No dataset selected", tool_call_id=runtime.tool_call_id
                    )
                ]
            }
        )

    settings = runtime.context.settings
    assert settings.mistral_api_key
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
                "content": get_prompt(dataset),
            },
            {"role": "user", "content": query},
        ],
        response_format=SqlQueryParts,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    sql_query_parts = response.choices[0].message.parsed
    assert sql_query_parts
    sql_query = sql_query_parts.get_query(dataset.asset.href)
    content = (
        f"Generated SQL:\n\n```sql\n{sql_query.query}\n```\n\n"
        f"Explanation:\n\n{sql_query_parts.explanation}"
    )
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=content,
                    tool_call_id=runtime.tool_call_id,
                )
            ],
            "sql_query": sql_query,
        }
    )


@tool
def execute_sql(runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Executes the sql and returns the result.

    Requires that the SQL has been generated from the selected dataset.
    """
    sql_query = runtime.state["sql_query"]
    if not sql_query:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="No sql query has been generated",
                        tool_call_id=runtime.tool_call_id,
                    )
                ]
            }
        )

    import duckdb

    try:
        data_frame = duckdb.sql(sql_query.query).to_df()
    except Exception as e:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error while executing SQL: {e}",
                        tool_call_id=runtime.tool_call_id,
                    )
                ],
                "sql_query": None,
            }
        )

    content = (
        f"Returned data had {len(data_frame)} rows. Either summarize the data by "
        "re-generating the SQL with `group by` or `distinct`, or create a plot using "
        "the full data frame that is saved as an artifact."
        if len(data_frame) > MAX_DATA_FRAME_LENGTH
        else "Data returned:\n\n"
        + cast(str, data_frame.to_markdown(index=False))
        + "\n\nExplanation: "
        + sql_query.explanation
    )
    logger.info(data_frame.head(10))
    serialized_data = data_frame.to_dict("tight", index=False)
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=content,
                    artifact=data_frame.to_dict(),
                    tool_call_id=runtime.tool_call_id,
                ),
            ],
            "serialized_data": serialized_data,
        }
    )


def get_prompt(dataset: Dataset) -> str:
    prompt = f"""I want you to act like a data scientist.

You will generate:

   - A SQL select statement
   - A SQL where statement
   - An optional SQL group by statement
   - An optional SQL order by statement
   - An optional SQL limit statement   
   - If aggregating data, limit to 1 non-aggregated field and its aggregated value
   - If aggregating data, non-aggregated fields must be in the GROUP BY clause
   - If aggregating data, order by the aggregated field in most relevant order
   - If aggregating data, limit to n results
   - A brief explanation of why you chose what you did, which should include a
     description of each output column

The SQL should be valid DuckDB SQL.

The dataset schema that the SQL will be used against is:

{dataset.get_schema_table()}

The first few rows of the table look like:

{dataset.get_head_table()}

Other instructions:

    - When aggregating numeric values, you must include a `where` clause
      that removes all `nan` values using the DuckDB `isnan` function

"""

    for table_column in dataset.item.properties.table_columns:
        if table_column.values:
            prompt += f"""The `{table_column.name}` column has the following values:

{"\n".join("- " + str(value) for value in table_column.values)}

"""

    if sql_instructions := dataset.item.properties.sql_instructions:
        prompt += f"""Additional instructions:

{"\n".join("- " + sql_instruction for sql_instruction in sql_instructions)}

"""

    return prompt


class BarChartData(BaseModel):
    type: str
    value: float | int
    value_label: str


class BarChart(BaseModel):
    title: str
    category_field: str
    value_field: str
    color_domain: list[str]
    color_range: list[str] = ["#79A1B7", "#195B83"]
    text_color: str | None
    values: list[BarChartData]


@tool
def make_bar_chart_config(
    runtime: ToolRuntime[Context, State],
) -> Command[None]:
    """Maps the serialized data result to a bar chart structure.

    Requires that the SQL has been executed and returned data with multiple columns.
    """
    serialized_data = runtime.state["serialized_data"]
    if not serialized_data or not serialized_data.data:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="Cannot create bar chart config: "
                        "No serialized data available to transform",
                        tool_call_id=runtime.tool_call_id,
                    )
                ]
            }
        )
    columns = serialized_data.columns
    if len(columns) == 1:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=(
                            "Cannot create bar chart config: Received single column. "
                            f"(column: {columns[0] if columns else 'unknown'}). "
                            "Bar charts require one or more numeric fields. "
                            "Please modify your query to include aggregated data, like "
                            "sums, or averages. "
                            "For example, try asking for 'top crops by exposure'. "
                        ),
                        tool_call_id=runtime.tool_call_id,
                    )
                ],
                "chart_data": None,
            }
        )

        # Check if second column contains numeric data
    data = serialized_data.data
    if data and len(data[0]) > 0 and len(data[0]) >= 2:
        # Sample the second column to check if it's numeric
        sample_value = data[0][1]
        if not isinstance(sample_value, (int, float)):
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            content=(
                                "Cannot create bar chart config: "
                                "The data does not contain numeric values. "
                                f"Columns available: {', '.join(columns)}. "
                                "Please modify your query to include numeric "
                                "aggregations like SUM, COUNT, or AVG."
                            ),
                            tool_call_id=runtime.tool_call_id,
                        )
                    ],
                    "chart_data": None,
                }
            )
    settings = runtime.context.settings
    assert settings.mistral_api_key
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
                "content": get_chart_config_prompt(serialized_data),
            },
            {
                "role": "user",
                "content": "Format the data for use in a bar chart component.",
            },
        ],
        response_format=BarChart,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    chart_data = response.choices[0].message.parsed
    assert chart_data
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content="Transformed SQL result to bar chart config structure.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
            "chart_data": json.loads(chart_data.model_dump_json()),
        }
    )


def get_chart_config_prompt(serialized_data: SerializedData) -> str:
    """Generate a prompt for data transformation using BarChart as the target format.

    Uses Pydantic's schema generation to ensure the prompt schema
    always matches the BarChart class definition.
    """
    schema = BarChart.model_json_schema()
    schema_str = json.dumps(schema, indent=2)

    prompt = f"""You are an expert in data visualization.
Your task is to analyze the following data and create a bar chart by:
1. Identifying the best categorical field for the X-axis
2. Identifying the best numeric field for the Y-axis
3. Creating a descriptive title
4. Mapping the data values to the BarChart schema provided below

Data to visualize:
{json.dumps(serialized_data, indent=2)}

You must respond with a JSON object matching this schema:
{schema_str}
"""

    return prompt
