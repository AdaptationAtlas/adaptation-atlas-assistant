from typing import cast

from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel

from ..context import Context
from ..dataset import Dataset
from ..state import SqlQuery, State

MAX_DATA_FRAME_LENGTH = 50


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
        api_key=settings.mistral_api_key.get_secret_value()
        if settings.mistral_api_key
        else None
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
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=content,
                    artifact=data_frame.to_dict(),
                    tool_call_id=runtime.tool_call_id,
                )
            ]
        },
    )


def get_prompt(dataset: Dataset) -> str:
    prompt = f"""I want you to act like a data scientist.

You will generate:

   - A SQL select statement
   - A SQL where statement
   - An optional SQL group by statement
   - An optional SQL order by statement
   - An optional SQL limit statement
   - A brief explanation of why you chose what you did, which should include a
     description of each output column

The SQL should be valid DuckDB SQL.

The dataset schema that the SQL will be used against is:

{dataset.get_schema_table()}

The first few rows of the table look like:

{dataset.get_head_table()}

Other instructions:

    - Whenever summing over numeric values, you must include a `where` clause
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
