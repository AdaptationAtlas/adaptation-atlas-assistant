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


class SqlQuery(BaseModel):
    """The current SQL query"""

    query: str
    """The query itself"""

    explanation: str
    """The explanation, which provides information about each output column"""
