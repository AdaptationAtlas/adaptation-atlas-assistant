from __future__ import annotations

from typing import Literal

from langchain.agents import AgentState
from pydantic import BaseModel

from .dataset import Dataset

# Chart type literals - add new chart types here
ChartType = Literal["bar", "map", "area", "dot", "line", "beeswarm", "heatmap"]


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

    chart_type: ChartType | None
    """The type of chart being generated."""

    chart_metadata: ChartMetadata | None
    """The chart metadata for the data."""


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

    y_column: str
    """The name of the numeric data column used for the y-axis"""

    grouping_column: str | None
    """An optional column name that should be used for grouping"""


class MapChartMetadata(BaseModel):
    """Data to create a map chart (choropleth)"""

    title: str
    """The title of the map chart."""

    id_column: str
    """The name of the data column containing ISO3 country codes (e.g., 'adm0_a3')"""

    value_column: str
    """The name of the numeric data column used for coloring"""

    color_scheme: str = "Oranges"
    """The Observable Plot color scheme to use"""


class AreaChartMetadata(BaseModel):
    """Data to create a stacked area chart"""

    title: str
    """The title of the area chart."""

    x_column: str
    """The name of the data column used for the x-axis (typically time or sequence)"""

    y_column: str
    """The name of the numeric data column used for the y-axis"""

    grouping_column: str | None
    """An optional column name for creating stacked areas (categories)"""


class LineChartMetadata(BaseModel):
    """Data to create a line chart"""

    title: str
    """The title of the line chart."""

    x_column: str
    """The name of the data column used for the x-axis (typically time or sequence)"""

    y_column: str
    """The name of the numeric data column used for the y-axis"""

    grouping_column: str | None
    """An optional column name for creating multiple series"""


class BeeswarmChartMetadata(BaseModel):
    """Data to create a beeswarm plot (1D scatter with jittered positioning)"""

    title: str
    """The title of the beeswarm plot."""

    category_column: str
    """The name of the categorical data column (groups along x-axis)"""

    value_column: str
    """The name of the numeric data column (values along y-axis)"""

    color_column: str | None
    """An optional column name for coloring points by category"""


class DotPlotMetadata(BaseModel):
    """Data to create a dot plot (scatter plot)"""

    title: str
    """The title of the dot plot."""

    x_column: str
    """The name of the data column used for the x-axis"""

    y_column: str
    """The name of the numeric data column used for the y-axis"""

    grouping_column: str | None
    """An optional column name for grouping/coloring dots by category"""

    size_column: str | None
    """An optional column name for sizing dots by value"""


class HeatmapChartMetadata(BaseModel):
    """Data to create a heatmap chart"""

    title: str
    """The title of the heatmap."""

    x_column: str
    """The name of the data column used for the x-axis (categories)"""

    y_column: str
    """The name of the data column used for the y-axis (categories)"""

    value_column: str
    """The name of the numeric data column used for cell color intensity"""

    color_scheme: str = "YlOrRd"
    """The Observable Plot color scheme to use"""


# Union type for chart metadata - add new metadata types here
ChartMetadata = (
    BarChartMetadata
    | MapChartMetadata
    | AreaChartMetadata
    | LineChartMetadata
    | BeeswarmChartMetadata
    | HeatmapChartMetadata
    | DotPlotMetadata
)
