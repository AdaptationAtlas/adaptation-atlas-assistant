"""An agent that runs tools in a feedback loop.

See https://docs.langchain.com/oss/python/langgraph/workflows-agents#agents for more.
"""

from __future__ import annotations

import datetime
from collections.abc import Awaitable, Callable
from typing import Any

import langchain.agents
from langchain.agents import AgentState
from langchain.agents.middleware.types import (
    AgentMiddleware,
    ModelRequest,
    ModelResponse,
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
from .tools.plot import generate_chart_metadata
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
    generate_chart_metadata,
]


class DisableParallelToolCalls(AgentMiddleware[AgentState[None], Context]):
    """Disable parallel tool calls to prevent race conditions.

    LangGraph's ToolNode executes multiple tool calls in parallel, which causes
    issues when tools depend on each other's state (e.g., generate_chart_metadata
    depends on data populated by generate_table). This middleware sets
    parallel_tool_calls=False in the Mistral API to force sequential tool calls.
    """

    state_schema: type[AgentState[None]] = AgentState
    tools: list[Any] = []

    async def awrap_model_call(  # pyright: ignore[reportImplicitOverride]
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        """Set parallel_tool_calls=False before each model call."""
        request.model_settings["parallel_tool_calls"] = False
        return await handler(request)


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
        middleware=[DisableParallelToolCalls()],
    )


def get_system_prompt() -> str:
    """Returns the initial prompt, with information about the current time."""
    return f"""You help users leverage Adaptation Atlas data to answer their questions.

You have access to the following tools: {", ".join(tool.name for tool in TOOLS)}.

Tool usage order:
1. list_datasets - to find available datasets
2. select_dataset - to choose a dataset
3. generate_table - to query data from the selected dataset
4. generate_chart_metadata - to create chart visualizations (ONLY after generate_table
   returns data). Use chart_type parameter: "bar", "map", or "area"

Chart type selection - analyze the user's query for these signals:

AREA CHART signals (time series / trends):
- Keywords: "over time", "trend", "changed", "growth", "historical", "projection"
- Questions about: evolution, progression, trajectory, how something developed

MAP CHART signals (geographic/spatial patterns):
- Keywords: "map", "geographic", "spatial distribution", "where"
- Questions about: seeing patterns across physical locations, regional variation
- Use when the USER wants to see WHERE something is happening

BAR CHART signals (categorical comparison):
- Keywords: "rank", "top", "compare", "breakdown", "which", "highest", "lowest"
- Questions about: rankings, comparisons, relative importance, proportions

Decision rules for ambiguous cases:
- TIME keywords ("over time", "trend", "changed") → AREA chart
- RANKING keywords ("rank", "top N", "highest") → BAR chart
- Geographic comparison ("across countries", "by region") 
without spatial intent → BAR chart
- Explicit spatial interest ("map", "where", "geographic distribution") → MAP chart
- If unclear, default to BAR chart

Examples:
- "How has maize production changed over time?" → area (time series keyword)
- "Rank countries by agricultural output" → bar (ranking keyword)
- "Map drought frequency across Ethiopia" → map (explicit "map" request)
- "Show drought frequency by region in Ethiopia" → map (spatial distribution)
- "Compare vulnerability across East African countries" → bar (comparison,
country names useful)
- "What are the main crops in Tanzania?" → bar (categorical breakdown)

Your output has two components:

    - A markdown-formatted answer to the user's question.
    - Zero or more example queries that will be used as suggestions for what the
      user might want to try next.

Today is {datetime.datetime.now(datetime.UTC):%Y-%m-%d}
        """
