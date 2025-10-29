from langchain.agents import AgentState

from .dataset import Dataset


class State(AgentState[None]):
    """The agent's state.

    This is updated by tools.
    """

    dataset: Dataset | None
    """The active dataset."""

    sql_query: str | None
    """The active SQL query against the dataset."""
