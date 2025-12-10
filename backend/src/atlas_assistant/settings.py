from __future__ import annotations

from abc import ABC, abstractmethod
from functools import lru_cache
from pathlib import Path
from typing import Literal, TypeVar, override

from langchain_chroma import Chroma
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings
from mistralai import Mistral
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

PydanticModel = TypeVar("PydanticModel", bound=BaseModel)

Message = dict[str, str]


class MistralConfig(BaseModel):
    type: Literal["mistral"] = "mistral"
    api_key: SecretStr
    size: Literal["large"] | Literal["medium"] | Literal["small"] = "small"
    temperature: float = 0.0


class Settings(BaseSettings):
    chat_model: MistralConfig | None = Field(default=None, discriminator="type")
    jwt_key: SecretStr
    embeddings_directory: Path = Path(__file__).parents[2] / "data" / "embeddings"
    stac_catalog_href: str = (
        "https://digital-atlas.s3.amazonaws.com/stac/AtlasV3/catalog.json"
    )
    cors_origins: list[str] = ["http://localhost:5173"]
    oidc_url: str | None = None
    oauth_client_id: str | None = None

    model_config = SettingsConfigDict(  # pyright: ignore[reportUnannotatedClassAttribute]
        env_file=".env", extra="forbid", env_nested_delimiter="__"
    )

    def get_model(self) -> BaseChatModel:
        """Returns the chat model as identified by these settings."""
        if isinstance(self.chat_model, MistralConfig):
            return ChatMistralAI(
                model_name=f"mistral-{self.chat_model.size}-latest",
                api_key=self.chat_model.api_key,
                temperature=self.chat_model.temperature,
            )
        else:
            raise ValueError(f"Unsupported chat model type: {type(self.chat_model)}")

    def get_embeddings(self) -> Chroma:
        if isinstance(self.chat_model, MistralConfig):
            embedding_function = MistralAIEmbeddings(
                model="mistral-embed", api_key=self.chat_model.api_key
            )
        else:
            raise ValueError(f"Unsupported chat model type: {type(self.chat_model)}")

        return Chroma(
            persist_directory=str(self.embeddings_directory),
            embedding_function=embedding_function,
        )

    def get_code_client(self) -> CodeClient:
        if isinstance(self.chat_model, MistralConfig):
            return CodestralClient(self.chat_model)
        else:
            raise ValueError(f"Unsupported chat model type: {type(self.chat_model)}")


class CodeClient(ABC):
    @abstractmethod
    def chat(
        self, messages: list[Message], response_format: type[PydanticModel]
    ) -> PydanticModel: ...


class CodestralClient(CodeClient):
    def __init__(self, mistral_config: MistralConfig):
        self.client: Mistral = Mistral(
            api_key=(
                mistral_config.api_key.get_secret_value()
                if mistral_config.api_key
                else None
            )
        )

    @override
    def chat(
        self, messages: list[Message], response_format: type[PydanticModel]
    ) -> PydanticModel:
        response = self.client.chat.parse(
            model="codestral-latest",
            messages=messages,
            response_format=response_format,
        )
        assert response.choices and response.choices[0] and response.choices[0].message
        parsed = response.choices[0].message.parsed
        assert parsed
        return parsed


@lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
