from typing import Any

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

    serialized_data: dict[str, Any] | None
    """The serialized data resulting from executing the SQL query."""

    chart_data: list[dict[str, Any]] | None
    """The chart data resulting from transforming the executed SQL serialized data."""
