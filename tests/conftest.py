from collections.abc import Callable
from typing import Any
from uuid import uuid4

import pytest

from atlas_assistant.agent import create_graph
from atlas_assistant.settings import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings()


@pytest.fixture
async def run_agent(settings: Settings) -> Callable[[str], Any]:
    graph = await create_graph(settings)

    thread_id = str(uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    async def run(query: str) -> Any:
        return await graph.ainvoke(
            {"messages": [{"role": "user", "content": query}]}, config
        )

    return run
