import pytest
from langchain_core.messages import HumanMessage

import atlas_assistant.agent
from atlas_assistant.context import Context
from atlas_assistant.settings import Settings


@pytest.mark.parametrize(
    "query", ("What crops are being grown in Kenya?", "What datasets are available?")
)
@pytest.mark.integration
def test_query(query: str, settings: Settings) -> None:
    agent = atlas_assistant.agent.create_agent(settings)
    _ = agent.invoke(
        {
            "messages": [HumanMessage(query)],
        },
        config={"configurable": {"thread_id": "test"}},
        context=Context(settings=settings),
    )
