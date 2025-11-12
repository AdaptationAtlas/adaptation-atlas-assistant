from __future__ import annotations

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

    data: str | None
    """The active data from a SQL query, as a json string."""

    bar_chart_metadata: BarChartMetadata | None
    """Bar chat metadata for the data."""


class SqlQuery(BaseModel):
    """The current SQL query"""

    query: str
    """The query itself"""

    explanation: str
    """The explanation, which provides information about each output column"""


class BarChartMetadata(BaseModel):
    """Data to create a bar chart"""

    title: str
    """The title of the bar chart."""

    x_column: str
    """The name the data column used for the x-axis"""

    y_columns: str
    """The name of the numeric data column used for the y-axis"""

    grouping_column: str | None
    """An optional column name that should be used for grouping"""
