from typing import Literal

from langgraph.prebuilt.chat_agent_executor import AgentStatePydantic
from pydantic import BaseModel, Field


class Base64Plot(BaseModel):
    type: Literal["image/png"] = "image/png"
    data: str


class AgentState(AgentStatePydantic):
    dataset: dict | None = Field(
        default=None,
        description="The dataset to use for the current task",
    )
    chart_query: str | None = Field(
        default=None, description="The SQL query to use for the plot"
    )
    python_code: str | None = Field(
        default=None, description="The Python code to use for the plot"
    )
    chart_data: dict | None = Field(
        default=None, description="The data to use for the plot"
    )
    chart: dict | None = Field(default=None, description="Plotly express plot")
