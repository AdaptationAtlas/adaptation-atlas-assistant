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

    explanation: str
    """An explanation of why the model generated this query"""

    def get_query(self, href: str) -> str:
        """Gets the full SQL query"""
        return (
            f"SELECT {self.select} FROM '{href}' WHERE {self.where} "
            f"GROUP BY {self.group_by}"
        )


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
    s3_href = dataset.s3_href
    if not s3_href:
        return Command(
            update={
                "dataset": None,
                "messages": [
                    ToolMessage(
                        content=f"Dataset {dataset.item.id} does not have an s3 href, "
                        "choose a different dataset",
                        tool_call_id=runtime.tool_call_id,
                    )
                ],
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
    sql_query = sql_query_parts.get_query(s3_href)
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


def get_prompt(dataset: Dataset) -> str:
    return f"""I want you to act like a data scientist.

You will generate three or four things:

   - An SQL select statement
   - AN SQL where statement
   - An optional SQL group by statement
   - A brief explanation of why you chose what you did

The SQL should be valid DuckDB SQL.

The dataset schema that the SQL will be used against is:

    {dataset.get_schema_table()}
"""
