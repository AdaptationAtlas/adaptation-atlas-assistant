from typing import Any, cast
from unittest.mock import Mock

import pytest
from langchain_core.messages import HumanMessage

import atlas_assistant.agent
from atlas_assistant.context import Context
from atlas_assistant.settings import Settings
from atlas_assistant.tools.sql import make_bar_chart_config


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


@pytest.mark.integration
def test_sql_execution(settings: Settings) -> None:
    agent = atlas_assistant.agent.create_agent(settings)
    thread_id = "test_sql_execution"

    states = list(
        agent.stream(
            {
                "messages": [HumanMessage("What crops are grown in Kenya?")],
            },
            config={"configurable": {"thread_id": thread_id}},
            stream_mode="values",
            context=Context(settings=settings),
        )
    )

    final_state = states[-1]
    assert "serialized_data" in final_state, (
        f"Agent stopped early. Keys in final state: {list(final_state.keys())}"
    )

    assert final_state["serialized_data"] is not None


@pytest.mark.parametrize(
    "serialized_data_fixture,expected_success",
    [
        ("serialized_data_valid", True),
        ("serialized_data_empty", False),
        ("serialized_data_single_column", False),
        ("serialized_data_only_categorical", False),
    ],
)
def test_make_bar_chart_config(
    serialized_data_fixture: str,
    expected_success: bool,
    settings: Settings,
    request: pytest.FixtureRequest,
) -> None:
    """Unit test for make_bar_chart_config tool."""

    serialized_data = request.getfixturevalue(serialized_data_fixture)

    mock_runtime = Mock()
    mock_runtime.state = {"serialized_data": serialized_data}
    mock_runtime.context = Context(settings=settings)
    mock_runtime.tool_call_id = "test-call-id"

    result = cast(Any, make_bar_chart_config).func(mock_runtime)

    # Check the command update
    messages = result.update.get("messages", [])
    assert len(messages) > 0

    tool_message = messages[0]

    if expected_success:
        assert "chart_data" in result.update
        if serialized_data["data"]:
            assert result.update["chart_data"] is not None
            chart_data = result.update["chart_data"]
            print(chart_data)
            assert "title" in chart_data
            assert "values" in chart_data
    else:
        assert "Cannot create bar chart" in tool_message.content
        assert result.update.get("chart_data") is None
