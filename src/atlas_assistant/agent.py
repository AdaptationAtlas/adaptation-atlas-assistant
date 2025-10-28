"""An agent that runs tools in a feedback loop.

See https://docs.langchain.com/oss/python/langgraph/workflows-agents#agents for more.
"""

import datetime

import langchain.agents
from langchain.agents import AgentState
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import (
    CompiledStateGraph,
)

from .dataset import Dataset, select_dataset
from .settings import Settings
from .sql import generate_sql

Agent = CompiledStateGraph


class State(AgentState[None]):
    """The agent's state.

    This is updated by tools.
    """

    dataset: Dataset | None
    """The active dataset."""

    sql_query: str | None
    """The active SQL query against the dataset."""


def create_agent(settings: Settings) -> Agent:
    """Creates a new agent."""
    return langchain.agents.create_agent(
        model=settings.get_model(),
        system_prompt=get_system_prompt(),
        tools=[select_dataset, generate_sql],
        checkpointer=InMemorySaver(),
    )


def get_system_prompt() -> str:
    """Returns the initial prompt, with information about the current time."""
    return f"""You help users leverage Adaptation Atlas data to answer their questions.

Today is {datetime.datetime.now(datetime.UTC):%Y-%m-%d}
        """
