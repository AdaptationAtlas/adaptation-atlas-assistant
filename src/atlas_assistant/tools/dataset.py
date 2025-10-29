from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from pydantic import BaseModel

from ..context import Context
from ..dataset import Dataset, Metadata
from ..settings import Settings
from ..state import State


class SearchResult(BaseModel):
    """The result of an embeddings search"""

    dataset: Dataset
    """The dataset"""

    score: float
    """The search score"""


@tool
def select_dataset(query: str, runtime: ToolRuntime[Context, State]) -> Command[None]:
    """Selects a dataset based on a user's query.

    Args:
        query: Search terms to select the dataset
    """
    settings = runtime.context.settings
    search_result = search(query, settings)
    content = f"Selected dataset: {search_result.dataset.get_description()}"
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=content,
                    tool_call_id=runtime.tool_call_id,
                )
            ],
            "dataset": search_result.dataset,
        }
    )


def search(query: str, settings: Settings) -> SearchResult:
    """Search the embeddings for datasets that match the query"""
    embeddings = settings.get_embeddings()
    results = embeddings.similarity_search_with_score(query, k=1)
    dataset = Metadata.model_validate(results[0][0].metadata).to_dataset()
    return SearchResult(dataset=dataset, score=results[0][1])
