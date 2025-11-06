"""An agent that runs tools in a feedback loop.

See https://docs.langchain.com/oss/python/langgraph/workflows-agents#agents for more.
"""

import datetime

import langchain.agents
from langchain.agents import AgentState
from langchain.agents.middleware.types import (
    _InputAgentState,  # pyright: ignore[reportPrivateUsage]
    _OutputAgentState,  # pyright: ignore[reportPrivateUsage]
)
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph

from .context import Context
from .settings import Settings
from .state import State
from .tools.dataset import select_dataset
from .tools.sql import execute_sql, generate_sql

Agent = CompiledStateGraph[
    AgentState[None], Context, _InputAgentState, _OutputAgentState[None]
]

TOOLS = [select_dataset, generate_sql, execute_sql]


def create_agent(settings: Settings) -> Agent:
    """Creates a new agent."""
    return langchain.agents.create_agent(
        model=settings.get_model(),
        system_prompt=get_system_prompt(),
        tools=TOOLS,
        checkpointer=InMemorySaver(),
        context_schema=Context,
        state_schema=State,
    )


def get_system_prompt() -> str:
    """Returns the initial prompt, with information about the current time."""
    return f"""You help users leverage Adaptation Atlas data to answer their questions.

You have access to the following tools: {", ".join(tool.name for tool in TOOLS)}

Today is {datetime.datetime.now(datetime.UTC):%Y-%m-%d}
        """
