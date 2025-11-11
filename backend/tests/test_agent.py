import pytest
from langchain_core.messages import HumanMessage

import atlas_assistant.agent
from atlas_assistant.agent import Agent
from atlas_assistant.context import Context
from atlas_assistant.settings import Settings


@pytest.fixture
def agent(settings: Settings) -> Agent:
    return atlas_assistant.agent.create_agent(settings)


@pytest.mark.parametrize(
    "query", ("What crops are being grown in Kenya?", "What datasets are available?")
)
@pytest.mark.integration
def test_query(query: str, settings: Settings) -> None:
    agent = atlas_assistant.agent.create_agent(settings)
    result = agent.invoke(
        {
            "messages": [HumanMessage(query)],
        },
        config={"configurable": {"thread_id": "test"}},
        context=Context(settings=settings),
    )

    assert "serialized_data" in result
    assert "chart_data" in result
    chart_data = result["chart_data"]

    ## Verify chart structure
    assert "title" in chart_data
    assert "categoryField" in chart_data
    assert "valueField" in chart_data
    assert "values" in chart_data
    assert isinstance(chart_data["values"], list)
    assert len(chart_data["values"]) > 0

    ## Verify first data point structure
    first_value = chart_data["values"][0]
    assert "type" in first_value
    assert "value" in first_value
    assert "valueLabel" in first_value
