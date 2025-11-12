from __future__ import annotations

from typing import Any

from langchain.agents import AgentState
from pydantic import BaseModel

from .dataset import Dataset


class State(AgentState[None]):
    """The agent's state.

    This is updated by tools.
    """

    dataset: Dataset | None
    """The active dataset."""

    sql_query: SqlQuery | None
    """The active SQL query against the dataset."""

    output_data: OutputData | None
    """The data resulting from executing the SQL query."""

    chart_data: list[dict[str, Any]] | None
    """The chart data resulting from transforming the output data from executed SQL."""


class SqlQuery(BaseModel):
    """The current SQL query"""

    query: str
    """The query itself"""

    explanation: str
    """The explanation, which provides information about each output column"""


class OutputData(BaseModel):
    columns: list[str]
    data: list[list[str | float | int | None]]
    column_names: list[str | None]
