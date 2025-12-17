"""A FastAPI application for answering questions from the frontend."""

from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated, Any, Literal

from fastapi import Depends, FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import StreamingResponse
from fastapi.security import (
    OpenIdConnect,
)
from httpx import HTTPStatusError
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.graph.message import BaseMessage
from langgraph.graph.state import RunnableConfig
from pydantic import BaseModel

from .agent import Agent, Output, create_agent
from .context import Context
from .dataset import Dataset
from .settings import Settings, get_settings
from .state import ChartMetadata, ChartType

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[dict[str, Any]]:
    agent = create_agent(settings)
    yield {"agent": agent}


assert settings.oidc_url
oidc = OpenIdConnect(openIdConnectUrl=settings.oidc_url)
if settings.oauth_client_id:
    swagger_ui_init_oauth = {
        "clientId": settings.oauth_client_id,
        "appName": "Adaptation Atlas Assistant",
        "scopes": "email openid phone",
    }
else:
    swagger_ui_init_oauth = None

app = FastAPI(lifespan=lifespan, swagger_ui_init_oauth=swagger_ui_init_oauth)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_settings() -> Settings:
    """Returns the current settings.

    Used for dependency injection.
    """
    return settings


class ChatRequest(BaseModel):
    """A chat request"""

    query: str
    """The question from the user."""

    thread_id: str | None = None
    """A thread id, provided by a previous chat."""


class ResponseMessage(BaseModel):
    """A response message from our API while chatting."""

    content: str | None
    """The content of the message"""

    thread_id: str
    """The thread id, which can be re-used to continue conversations"""

    def to_event_stream(self) -> str:
        return "data: " + self.model_dump_json()


class OutputResponseMessage(ResponseMessage):
    """The response from an output"""

    content: str | None = None

    type: Literal["output"] = "output"
    """The type of the response"""

    output: Output
    """The output"""


class ToolResponseMessage(ResponseMessage):
    """The response from a tool"""

    type: Literal["tool"] = "tool"
    """The type of the response"""

    name: str
    """The name of the tool"""

    status: str
    """The status of the tool call"""


class SelectDatasetResponseMessage(ToolResponseMessage):
    """The response from select_dataset"""

    name: str = "select_dataset"

    dataset: Dataset
    """The selected dataset"""


class GenerateTableResponseMessage(ToolResponseMessage):
    """The response from generate_table"""

    name: str = "generate_table"

    data: str | None
    """The table data as a JSON string"""

    sql_query: str | None
    """The sql query used to generate the data"""


class GenerateChartMetadataResponseMessage(ToolResponseMessage):
    """The response from generate_chart_metadata"""

    name: str = "generate_chart_metadata"

    chart_type: ChartType | None
    """The type of chart (bar, map, or area)"""

    chart_metadata: ChartMetadata | None
    """The chart metadata"""

    data: str | None
    """The table data as a JSON string"""


class AiResponseMessage(ResponseMessage):
    """The response from the AI"""

    type: Literal["ai"] = "ai"
    """The type of the response"""

    finish_reason: str
    """The reason why the agent stopped"""


class ErrorResponseMessage(ResponseMessage):
    """An error response"""

    type: Literal["error"] = "error"


@app.get("/health")
def health_check():
    return {"status": "OK"}


@app.post(
    "/chat",
    tags=["chat"],
    response_model=ToolResponseMessage
    | SelectDatasetResponseMessage
    | GenerateTableResponseMessage
    | GenerateChartMetadataResponseMessage
    | AiResponseMessage
    | OutputResponseMessage
    | ErrorResponseMessage,
)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    token: Annotated[str, Depends(oidc)],  # pyright: ignore[reportUnusedParameter]
    accept: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    agent: Agent = request.state.agent
    thread_id = chat_request.thread_id or str(uuid.uuid4())
    event_stream = (accept and "text/event-stream" in accept) or False
    return StreamingResponse(
        query_agent(agent, chat_request.query, thread_id, settings, event_stream),
        media_type="text/event-stream" if event_stream else "application/x-ndjson",
    )


async def query_agent(
    agent: Agent,
    query: str,
    thread_id: str,
    settings: Settings,
    event_stream: bool,
) -> AsyncGenerator[str]:
    """Query the agent and yield messages.

    Each message is a JSON object on a new line.
    """
    config: RunnableConfig = {"configurable": {"thread_id": thread_id}}
    ensure_messages_ready_for_user(agent, config)
    try:
        async for update in agent.astream(
            {"messages": [HumanMessage(content=query)]},
            stream_mode="updates",
            config=config,
            context=Context(settings=settings),
        ):
            for value in update.values():
                if messages := value.get("messages"):
                    for msg in messages:
                        response_message = maybe_create_response_message(msg, thread_id)
                        if response_message:
                            if event_stream:
                                yield response_message.to_event_stream() + "\n\n"
                            else:
                                yield response_message.model_dump_json() + "\n"
    except HTTPStatusError as e:
        logging.error(f"HTTP error occurred: {e}")
        response_message = ErrorResponseMessage(content=str(e), thread_id=thread_id)
        if event_stream:
            yield response_message.to_event_stream() + "\n\n"
        else:
            yield response_message.model_dump_json() + "\n"


def maybe_create_response_message(
    message: BaseMessage, thread_id: str
) -> ResponseMessage | None:
    additional_kwargs = message.to_json().get("kwargs", {}).get("additional_kwargs")
    if additional_kwargs and (tool_calls := additional_kwargs.get("tool_calls")):
        for tool_call in tool_calls:
            function = tool_call.get("function")
            if function.get("name") == "Output":
                return OutputResponseMessage(
                    output=Output.model_validate_json(function.get("arguments")),
                    thread_id=thread_id,
                )
    if message.content:
        return create_response_message(
            message,
            thread_id,
        )


def create_response_message(
    message: BaseMessage,
    thread_id: str,
) -> ResponseMessage | None:
    assert isinstance(message.content, str)
    if isinstance(message, ToolMessage):
        match message.name:
            case "select_dataset":
                return SelectDatasetResponseMessage(
                    content=message.content,
                    status=message.status,
                    thread_id=thread_id,
                    dataset=message.artifact,
                )
            case "generate_table":
                artifact = message.artifact or {}
                return GenerateTableResponseMessage(
                    content=message.content,
                    status=message.status,
                    thread_id=thread_id,
                    data=artifact.get("data"),
                    sql_query=artifact.get("sql_query"),
                )
            case "generate_chart_metadata":
                artifact = message.artifact or {}
                return GenerateChartMetadataResponseMessage(
                    content=message.content,
                    status=message.status,
                    thread_id=thread_id,
                    chart_type=artifact.get("chart_type")
                    if isinstance(artifact, dict)
                    else None,
                    chart_metadata=artifact.get("chart_metadata")
                    if isinstance(artifact, dict)
                    else None,
                    data=artifact.get("data") if isinstance(artifact, dict) else None,
                )
            case None:
                logger.warning(
                    f"Tool message does not have a name: {message.to_json()}"
                )
                return None
            case _:
                return ToolResponseMessage(
                    name=message.name,
                    content=message.content,
                    status=message.status,
                    thread_id=thread_id,
                )
    elif isinstance(message, AIMessage):
        return AiResponseMessage(
            content=message.content,
            finish_reason=message.response_metadata["finish_reason"],
            thread_id=thread_id,
        )
    else:
        logger.warning(f"No response messages created for message: {message.to_json()}")
        return None


def ensure_messages_ready_for_user(agent: Agent, config: RunnableConfig) -> None:
    """Mistral fails when a tool message is followed by a user message.
    Append a short assistant acknowledgement so the next user turn comes
    after an assistant role.
    """
    state = agent.get_state(config)
    messages = list(state.values.get("messages", []))

    if messages and isinstance(messages[-1], ToolMessage):
        last_tool = messages[-1]
        acknowledgement = (
            f"Noted the result from tool '{last_tool.name}'."
            if getattr(last_tool, "name", None)
            else "Noted the previous tool result."
        )
        _ = agent.update_state(
            config, {"messages": [AIMessage(content=acknowledgement)]}
        )
