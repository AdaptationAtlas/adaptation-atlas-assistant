"""A FastAPI application for answering questions from the frontend."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from typing import Annotated, Literal

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.errors import GraphRecursionError
from langgraph.graph.message import BaseMessage
from pwdlib import PasswordHash
from pydantic import BaseModel
from starlette import status

from . import settings
from .agent import Agent, create_agent
from .context import Context
from .settings import Settings

algorithm = "HS256"
password_hash = PasswordHash.recommended()

app = FastAPI()

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
    "/chat", tags=["chat"], response_model=ToolResponseMessage | AiResponseMessage
)
async def chat(
    chat_request: ChatRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],  # pyright: ignore[reportUnusedParameter]
    accept: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    agent = create_agent(settings)
    thread_id = uuid.uuid4()
    event_stream = (accept and "text/event-stream" in accept) or False
    return StreamingResponse(
        query_agent(agent, chat_request.query, str(thread_id), settings, event_stream),
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
    agent: Agent, query: str, thread_id: str, settings: Settings, event_stream: bool
) -> AsyncGenerator[str]:
    """Query the agent and yield messages.

    Each message is a JSON object on a new line.
    """
    async for update in agent.astream(
        {"messages": [HumanMessage(content=query)]},
        stream_mode="updates",
        config={"configurable": {"thread_id": thread_id}},
        context=Context(settings=settings),
    ):
        for value in update.values():
            if messages := value.get("messages"):
                for msg in messages:
                    if msg.content:
                        response_message = create_response_message(msg)
                        if response_message:
                            if event_stream:
                                yield response_message.to_event_stream() + "\n\n"
                            else:
                                yield response_message.model_dump_json() + "\n"


def create_response_message(
    message: BaseMessage,
) -> ToolResponseMessage | AiResponseMessage | None:
    if isinstance(message, ToolMessage):
        assert isinstance(message.content, str)
        return ToolResponseMessage(
            name=message.name,
            content=message.content,
            status=message.status,
        )
    elif isinstance(message, AIMessage):
        assert isinstance(message.content, str)
        return AiResponseMessage(
            content=message.content,
            finish_reason=message.response_metadata["finish_reason"],
        )
