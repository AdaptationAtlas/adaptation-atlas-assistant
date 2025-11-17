"""A FastAPI application for answering questions from the frontend."""

from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncGenerator, Sequence
from contextlib import asynccontextmanager
from typing import Annotated, Any, Literal

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.errors import GraphRecursionError
from langgraph.graph.message import BaseMessage
from langgraph.graph.state import RunnableConfig
from langgraph.types import StateSnapshot
from pwdlib import PasswordHash
from pydantic import BaseModel
from starlette import status

from . import settings
from .agent import Agent, create_agent
from .context import Context
from .settings import Settings
from .state import BarChartMetadata

logger = logging.getLogger(__name__)
algorithm = "HS256"
password_hash = PasswordHash.recommended()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[dict[str, Any]]:
    agent = create_agent(get_settings())
    yield {"agent": agent}


app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_settings() -> Settings:
    """Returns the current settings.

    Used for dependency injection.
    """
    return settings.get_settings()


class ChatRequest(BaseModel):
    """A chat request"""

    query: str
    """The question from the user."""

    thread_id: str | None = None
    """A thread id, provided by a previous chat."""


class Token(BaseModel):
    """The return type for the token endpoint."""

    access_token: str
    """The JWT."""

    token_type: str
    """The type of the token."""


class User(BaseModel):
    """An extremely simple user model."""

    username: str
    """The username"""

    def create_access_token(self, settings: Settings) -> str:
        """Creates an access token for this user."""
        return jwt.encode(
            {"sub": self.username},
            settings.jwt_key.get_secret_value(),
            algorithm=algorithm,
        )


class ResponseMessage(BaseModel):
    """A response message from our API while chatting."""

    content: str
    """The content of the message"""

    thread_id: str
    """The thread id, which can be re-used to continue conversations"""

    def to_event_stream(self) -> str:
        return "data: " + self.model_dump_json()


class ToolResponseMessage(ResponseMessage):
    """The response from a tool"""

    type: Literal["tool"] = "tool"
    """The type of the response"""

    name: str | None
    """The name of the tool"""

    status: str
    """The status of the tool call"""


class AiResponseMessage(ResponseMessage):
    """The response from the AI"""

    type: Literal["ai"] = "ai"
    """The type of the response"""

    finish_reason: str
    """The reason why the agent stopped"""


class BarChartResponseMessage(ResponseMessage):
    """The agent has created a bar chart and here it is.

    The message content is the data as a JSON string.
    """

    type: Literal["bar-chart"] = "bar-chart"

    metadata: BarChartMetadata


class Error(BaseModel):
    """An error response"""

    type: str
    """The type of the error"""

    message: str
    """The error message"""


def authenticate_user(
    username: str, password: str, users: dict[str, str]
) -> User | None:
    """Checks a user's password against a naive user 'database'."""
    hashed_password = users.get(username)
    if hashed_password and password_hash.verify(password, hashed_password):
        return User(username=username)
    else:
        return None


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """Returns the current user, as decoded from a JWT."""
    payload = jwt.decode(
        token, settings.jwt_key.get_secret_value(), algorithms=[algorithm]
    )
    username: str | None = payload.get("sub")
    if username in settings.users:
        return User(username=username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/health")
def health_check():
    return {"status": "OK"}


@app.get("/me", tags=["auth"])
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Returns information about the currently logged-in user."""
    return current_user


@app.post("/token", tags=["auth"])
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Token:
    """Logs in a user with a username and password."""
    user = authenticate_user(form_data.username, form_data.password, settings.users)
    if user:
        return Token(
            access_token=user.create_access_token(settings), token_type="bearer"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.post(
    "/chat",
    tags=["chat"],
    response_model=ToolResponseMessage | AiResponseMessage | BarChartResponseMessage,
)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],  # pyright: ignore[reportUnusedParameter]
    accept: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    agent: Agent = request.state.agent
    thread_id = chat_request.thread_id or str(uuid.uuid4())
    event_stream = (accept and "text/event-stream" in accept) or False
    return StreamingResponse(
        query_agent(agent, chat_request.query, thread_id, settings, event_stream),
        media_type="text-event-stream" if event_stream else "application/x-ndjson",
    )


@app.exception_handler(GraphRecursionError)
async def graph_recursion_handler(
    _request: Request, exc: GraphRecursionError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=Error(message=str(exc), type="graph recursion"),
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
    async for update in agent.astream(
        {"messages": [HumanMessage(content=query)]},
        stream_mode="updates",
        config=config,
        context=Context(settings=settings),
    ):
        state = agent.get_state(config)
        for value in update.values():
            if messages := value.get("messages"):
                for msg in messages:
                    if msg.content:
                        for response_message in create_response_messages(
                            msg, thread_id, state
                        ):
                            if event_stream:
                                yield response_message.to_event_stream() + "\n\n"
                            else:
                                yield response_message.model_dump_json() + "\n"


def create_response_messages(
    message: BaseMessage,
    thread_id: str,
    state: StateSnapshot,
) -> Sequence[ResponseMessage]:
    if isinstance(message, ToolMessage):
        assert isinstance(message.content, str)
        tool_response_message = ToolResponseMessage(
            name=message.name,
            content=message.content,
            status=message.status,
            thread_id=thread_id,
        )
        messages: list[ResponseMessage] = [tool_response_message]
        if tool_response_message.name == "generate_bar_chart_metadata":
            messages.append(
                BarChartResponseMessage(
                    content=state.values["data"],
                    metadata=state.values["bar_chart_metadata"],
                    thread_id=thread_id,
                )
            )
        return messages
    elif isinstance(message, AIMessage):
        assert isinstance(message.content, str)
        return [
            AiResponseMessage(
                content=message.content,
                finish_reason=message.response_metadata["finish_reason"],
                thread_id=thread_id,
            )
        ]
    else:
        logger.warning(f"No response messages created for message: {message.to_json()}")
        return []
