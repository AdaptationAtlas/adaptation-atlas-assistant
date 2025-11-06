"""A FastAPI application for answering questions from the frontend."""

import json
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from langchain_core.messages import HumanMessage
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class ChatRequest(BaseModel):
    """A chat request"""

    query: str
    """The question from the user."""


def get_settings() -> Settings:
    """Returns the current settings.

    Used for dependency injection.
    """
    return settings.get_settings()


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


@app.post("/chat", tags=["chat"])
async def chat(
    chat_request: ChatRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],  # pyright: ignore[reportUnusedParameter]
) -> StreamingResponse:
    agent = create_agent(settings)
    thread_id = uuid.uuid4()
    return StreamingResponse(
        query_agent(agent, chat_request.query, str(thread_id), settings)
    )


async def query_agent(
    agent: Agent, query: str, thread_id: str, settings: Settings
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
        for key, value in update.items():
            if messages := value.get("messages"):
                for msg in messages:
                    if msg.content:
                        yield (
                            json.dumps(
                                {
                                    "key": key,
                                    "message": msg.to_json(),
                                }
                            )
                            + "\n"
                        )
