from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel

from ..context import Context
from ..dataset import Dataset
from ..state import State


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

    def get_query(self, href: str) -> str:
        """Gets the full SQL query"""
        parts = [f"SELECT {self.select} FROM '{href}' WHERE {self.where}"]
        if self.group_by:
            parts.append(f"GROUP BY {self.group_by}")
        if self.order_by:
            parts.append(f"ORDER BY {self.order_by}")
        if self.limit:
            parts.append(f"LIMIT {self.limit}")
        return " ".join(parts)


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
    content = f"Generated SQL: {sql_query}\nExplanation: {sql_query_parts.explanation}"
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

    data_frame = duckdb.sql(sql_query).to_df().head(50)
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content="Data returned:\n" + data_frame.to_string(index=False),
                    tool_call_id=runtime.tool_call_id,
                )
            ]
        }
    )


def get_prompt(dataset: Dataset) -> str:
    prompt = f"""I want you to act like a data scientist.

You will generate between three and six things:

   - An SQL select statement
   - AN SQL where statement
   - An optional SQL group by statement
   - An optional SQL order by statement
   - An optional SQL limit statement
   - A brief explanation of why you chose what you did

The SQL should be valid DuckDB SQL.

The dataset schema that the SQL will be used against is:

{dataset.get_schema_table()}

The first few rows of the table look like:

{dataset.get_head_table()}

"""

    for table_column in dataset.item.properties.table_columns:
        if table_column.values:
            prompt += f"""The `{table_column.name}` column has the following values:

{"\n".join("- " + value for value in table_column.values)}

"""

    if sql_instructions := dataset.item.properties.sql_instructions:
        prompt += f"""Additional instructions:

{"\n".join("- " + sql_instruction for sql_instruction in sql_instructions)}

"""

    return prompt
