"""An agent that runs tools in a feedback loop.

See https://docs.langchain.com/oss/python/langgraph/workflows-agents#agents for more.
"""

from __future__ import annotations

import datetime

import langchain.agents
from langchain.agents import AgentState
from langchain.agents.middleware.types import (
    _InputAgentState,  # pyright: ignore[reportPrivateUsage]
    _OutputAgentState,  # pyright: ignore[reportPrivateUsage]
)
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from .context import Context
from .settings import Settings
from .state import State
from .tools.dataset import list_datasets, select_dataset
from .tools.plot import generate_bar_chart_metadata
from .tools.sql import generate_table


class Output(BaseModel):
    answer: str
    """A markdown-formatted answer to the user's question."""

    queries: list[str]
    """Zero or more queries that will be used as suggestions for what the user
    might want to try next."""


Agent = CompiledStateGraph[
    AgentState[None], Context, _InputAgentState, _OutputAgentState[None]
]

TOOLS = [
    list_datasets,
    select_dataset,
    generate_table,
    generate_bar_chart_metadata,
]


def create_agent(settings: Settings) -> Agent:
    """Creates a new agent."""
    return langchain.agents.create_agent(
        model=settings.get_model(),
        system_prompt=get_system_prompt(),
        tools=TOOLS,
        checkpointer=InMemorySaver(),
        context_schema=Context,
        state_schema=State,
        response_format=Output,  # pyright: ignore[reportArgumentType]
    )


def get_system_prompt() -> str:
    """Returns the initial prompt, with information about the current time."""
    return f"""You help users leverage Adaptation Atlas data to answer their questions.

You have access to the following tools: {", ".join(tool.name for tool in TOOLS)}.

Your output has two components:

    - A markdown-formatted answer to the user's question.
    - Zero or more example queries that will be used as suggestions for what the
      user might want to try next.

Today is {datetime.datetime.now(datetime.UTC):%Y-%m-%d}
        """
