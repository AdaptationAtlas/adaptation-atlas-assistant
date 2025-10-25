import logging
from pathlib import Path
from typing import Annotated

from langchain_chroma import Chroma
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool
from langchain_core.tools.base import InjectedToolCallId
from langchain_mistralai import MistralAIEmbeddings
from langgraph.types import Command

from ..settings import Settings, get_settings

logger = logging.getLogger(__name__)


async def load_datasets_vector_embeddings(settings: Settings) -> Chroma:
    # Initialize ChromaDB with existing database
    db_path = Path(__file__).parents[3] / "data" / "atlas-assistant-docs-mistral-index"
    if not Path(db_path).exists():
        raise RuntimeError(f"Database does not exist at path {db_path}.")
    embedder = MistralAIEmbeddings(
        model="mistral-embed", api_key=settings.mistral_api_key
    )
    vectorstore = Chroma(persist_directory=str(db_path), embedding_function=embedder)
    return vectorstore


@tool("select_dataset_tool")
async def select_dataset(
    dataset_query: str, tool_call_id: Annotated[str, InjectedToolCallId]
) -> Command:
    """Select a dataset from the list of available datasets.

    dataset_query: "The query to select a dataset"

    Updates the `dataset` state with the details of the best matching dataset if found,
    """
    logger.info(f"Finding dataset for query: {dataset_query}")
    settings = get_settings()
    vectorstore = await load_datasets_vector_embeddings(settings)

    results = vectorstore.similarity_search_with_score(dataset_query, k=3)

    return Command(
        update={
            "dataset": results[0][0].metadata,
            "messages": [
                ToolMessage(
                    content=("Returning dataset: " + results[0][0].page_content),
                    tool_call_id=tool_call_id,
                )
            ],
        },
    )
