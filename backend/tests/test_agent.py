import pytest
from langchain_core.messages import HumanMessage

import atlas_assistant.agent
from atlas_assistant.agent import Agent
from atlas_assistant.context import Context
from atlas_assistant.settings import Settings

pytestmark = pytest.mark.integration


@pytest.fixture
def agent(settings: Settings) -> Agent:
    return atlas_assistant.agent.create_agent(settings)


def test_kenya_crops(agent: Agent, settings: Settings) -> None:
    result = agent.invoke(
        {
            "messages": [HumanMessage("What crops are being grown in Kenya?")],
        },
        config={"configurable": {"thread_id": "test"}},
        context=Context(settings=settings),
    )

    assert "serialized_data" in result
    assert "chart_data" in result
    chart_data = result["chart_data"]

    # # Verify chart structure
    assert "title" in chart_data
    assert "categoryField" in chart_data
    assert "valueField" in chart_data
    assert "values" in chart_data
    assert isinstance(chart_data["values"], list)
    assert len(chart_data["values"]) > 0

    # # Verify first data point structure
    first_value = chart_data["values"][0]
    assert "type" in first_value
    assert "value" in first_value
    assert "valueLabel" in first_value
