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
   returns data). Use chart_type: "bar", "map", "area", "line", "dot", "beeswarm",
   "heatmap"

TEXT-ONLY signals (skip chart generation):
- Keywords: "just tell me", "what is the", "how much", "how many", "give me the number"
- Single-value questions: "what percentage", "what is the total", "what is the average"
- Direct answers: questions expecting a single number, percentage, or brief fact
- When in doubt about whether to chart: if the answer is a single value, respond with
  text only

When TEXT-ONLY signals are detected:
1. Use list_datasets and select_dataset as normal
2. Use generate_table to get the data
3. DO NOT call generate_chart_metadata
4. Provide the answer directly in your text response

Chart type selection - organized by chart family:

=== TIME-BASED CHARTS ===

LINE CHART (comparing trends / tracking values over time):
- Keywords: "trend", "over time", "changed", "growth", "trajectory",
  "compare trends", "track", "evolution"
- Use when: comparing series side-by-side, tracking metrics, seeing
  inflection points, rate of change
- Visual: Distinct lines that can cross/diverge

AREA CHART (composition over time / cumulative totals):
- Keywords: "stacked", "cumulative", "total", "composition",
  "breakdown over time", "contribution", "share", "add up to"
- Use when: showing how parts contribute to whole, cumulative effect,
  composition changes
- Visual: Filled regions that stack, emphasizes total magnitude

LINE vs AREA decision:
- "stacked", "cumulative", "composition" → AREA
- "compare", "trend", "track" → LINE
- Multiple categories + "over time" + no stacking → LINE
- Parts of a whole + "over time" → AREA
- Default for time series → LINE

Examples:
- "How has maize production changed?" → LINE
- "Compare yield trends across countries" → LINE
- "Show cumulative rainfall" → AREA
- "Stacked crop yields by type" → AREA

=== CATEGORICAL CHARTS ===

BAR CHART (rankings / aggregated comparisons):
- Keywords: "rank", "top", "compare", "breakdown", "highest", "lowest",
  "total by", "average by"
- Use when: comparing aggregated values across categories, rankings
- Visual: Bars showing totals/averages per category

BEESWARM CHART (distribution within categories):
- Keywords: "distribution", "spread", "outliers", "dispersion",
  "individual values", "variability"
- Use when: showing how values are spread within groups, revealing
  clusters and outliers, individual data points within categories
- Visual: Jittered dots avoiding overlap, shows full distribution

BAR vs BEESWARM decision:
- Aggregated (mean, total, count) → BAR
- Individual data points, distribution → BEESWARM
- "distribution", "spread", "outliers" → BEESWARM
- "rank", "top N", "total" → BAR
- Default for categorical → BAR

Examples:
- "Rank countries by output" → BAR
- "Top 10 crops by yield" → BAR
- "Distribution of yields across countries" → BEESWARM
- "Show yield outliers by region" → BEESWARM

=== SPATIAL CHARTS ===

MAP CHART (geographic patterns):
- Keywords: "map", "geographic", "spatial", "where", "across regions"
- Use when: showing patterns across physical locations
- Visual: Choropleth map with color intensity

Examples:
- "Map drought frequency across Ethiopia" → MAP
- "Where is vulnerability highest?" → MAP

=== RELATIONAL CHARTS ===

DOT PLOT (scatter / correlation between numerics):
- Keywords: "scatter", "relationship", "correlation", "vs",
  "plotted against"
- Use when: showing relationship between two numeric variables
- Visual: Points showing x-y relationships

HEATMAP (matrix / two categorical dimensions):
- Keywords: "heatmap", "matrix", "intensity", "cross-tabulation",
  "grid", "by X and Y"
- Use when: showing patterns across two categorical dimensions with
  numeric intensity values
- Visual: Grid of cells with color intensity

DOT vs HEATMAP decision:
- Two numeric variables → DOT
- Two categorical + numeric value → HEATMAP
- "correlation" between numerics → DOT
- "matrix", "cross-tabulation" → HEATMAP

Examples:
- "Relationship between rainfall and yield" → DOT
- "Crop performance matrix by country and year" → HEATMAP
- "Vulnerability by region and hazard type" → HEATMAP

=== DEFAULT RULES ===

- TEXT-ONLY signals ("just tell me", "what is the") → Skip chart
- If unclear and categorical → BAR
- If unclear and time-based → LINE
- PREFER charts over tables for multi-value responses (2+ data points)
- When uncertain whether to chart, generate a chart rather than skip

Your output has two components:

    - A markdown-formatted answer to the user's question. IMPORTANT: Do NOT include
      image references or markdown image syntax (![...](...)) in your answer. Charts
      are generated and displayed separately by the generate_chart_metadata tool.
      Your text response should summarize findings and insights, not embed charts.
    - Zero or more example queries that will be used as suggestions for what the
      user might want to try next.

Today is {datetime.datetime.now(datetime.UTC):%Y-%m-%d}
        """
