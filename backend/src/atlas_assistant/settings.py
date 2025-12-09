from functools import lru_cache
from pathlib import Path
from typing import Literal

from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mistral_api_key: SecretStr | None = None
    chat_model_size: Literal["large"] | Literal["medium"] | Literal["small"] = "small"
    chat_model_temperature: float = 0.0
    jwt_key: SecretStr
    embeddings_directory: Path = Path(__file__).parents[2] / "data" / "embeddings"
    stac_catalog_href: str = (
        "https://digital-atlas.s3.amazonaws.com/stac/AtlasV3/catalog.json"
    )
    cors_origins: list[str] = ["http://localhost:5173"]
    oidc_url: str
    oauth_client_id: str | None

    model_config = SettingsConfigDict(env_file=".env", extra="forbid")  # pyright: ignore[reportUnannotatedClassAttribute]

    def get_model(self) -> ChatMistralAI:
        """Returns the chat model as identified by these settings."""
        return ChatMistralAI(
            model_name=f"mistral-{self.chat_model_size}-latest",
            api_key=self.mistral_api_key,
            temperature=self.chat_model_temperature,
        )

    def get_embeddings(self) -> Chroma:
        assert self.mistral_api_key
        embedding_function = MistralAIEmbeddings(
            model="mistral-embed", api_key=self.mistral_api_key
        )
        return Chroma(
            persist_directory=str(self.embeddings_directory),
            embedding_function=embedding_function,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
