from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from mistralai import Mistral
from pydantic import BaseModel

from atlas_assistant.settings import get_settings


class SqlQuery(BaseModel):
    query: str
    """The SQL query"""

    explanation: str
    """An explanation of why the model generated this query"""


@tool
def generate_sql(query: str, runtime: ToolRuntime) -> Command[None]:
    """Generates SQL to query a dataset.

    Args:
        query: The question that we're going to answer with an SQL query.
    """
    settings = get_settings()
    assert settings.mistral_api_key
    client = Mistral(api_key=settings.mistral_api_key.get_secret_value())
    response = client.chat.parse(
        model="codestral-latest",
        messages=[
            {
                "role": "system",
                "content": get_prompt(query),
            },
            {"role": "user", "content": query},
        ],
        response_format=SqlQuery,
    )
    assert response.choices and response.choices[0] and response.choices[0].message
    sql_query = response.choices[0].message.parsed
    assert sql_query
    content = f"Generated SQL: {sql_query.query}\nExplanation: {sql_query.explanation}"
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=content,
                    tool_call_id=runtime.tool_call_id,
                )
            ],
            "sql_query": sql_query.query,
        }
    )


def get_prompt(query: str) -> str:
    return f"""I want you to act like a data scientist.

You will generate an SQL query that will be used with DuckDB to answer a query.

The query is: {query}
"""
