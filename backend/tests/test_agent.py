import pytest
from langchain_core.messages import HumanMessage

import atlas_assistant.agent
from atlas_assistant.agent import Agent
from atlas_assistant.context import Context
from atlas_assistant.settings import Settings


@pytest.fixture
def agent(settings: Settings) -> Agent:
    return atlas_assistant.agent.create_agent(settings)


@pytest.mark.vcr
def test_kenya_crops(agent: Agent, settings: Settings) -> None:
    _ = agent.invoke(
        {
            "messages": [HumanMessage("What crops are being grown in Kenya?")],
        },
        config={"configurable": {"thread_id": "test"}},
        context=Context(settings=settings),
    )
