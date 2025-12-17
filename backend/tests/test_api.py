import pytest
from fastapi.testclient import TestClient
from langchain.messages import ToolMessage
from langgraph.graph.message import BaseMessage
from pytest import FixtureRequest

import atlas_assistant.api
from atlas_assistant.dataset import Dataset
from atlas_assistant.state import BarChartMetadata, MapChartMetadata


@pytest.mark.integration
@pytest.mark.parametrize("headers", [None, {"accept": "text/event-stream"}])
def test_chat(client: TestClient, headers: dict[str, str] | None) -> None:
    response = client.post(
        "/chat", json={"query": "What crops are being grown in Kenya?"}, headers=headers
    )
    _ = response.raise_for_status()


@pytest.fixture
def message(request: FixtureRequest, dataset: Dataset) -> BaseMessage:
    match request.param:
        case "select_dataset":
            return ToolMessage(
                name="select_dataset", tool_call_id="foo", artifact=dataset
            )
        case "generate_table":
            return ToolMessage(
                name="generate_table",
                tool_call_id="foo",
                artifact={"data": "{}", "sql_query": "SELECT * FROM 'file.parquet'"},
            )
        case "generate_table_error":
            return ToolMessage(
                name="generate_table",
                tool_call_id="foo",
            )
        case "generate_chart_metadata_bar":
            return ToolMessage(
                name="generate_chart_metadata",
                tool_call_id="foo",
                artifact={
                    "data": "{}",
                    "chart_type": "bar",
                    "chart_metadata": BarChartMetadata(
                        title="A title",
                        x_column="foo",
                        y_column="bar",
                        grouping_column=None,
                    ),
                },
            )
        case "generate_chart_metadata_map":
            return ToolMessage(
                name="generate_chart_metadata",
                tool_call_id="foo",
                artifact={
                    "data": "{}",
                    "chart_type": "map",
                    "chart_metadata": MapChartMetadata(
                        title="A map title",
                        id_column="iso3",
                        value_column="value",
                        color_scheme="Oranges",
                    ),
                },
            )
        case "generate_chart_metadata_error":
            return ToolMessage(
                name="generate_chart_metadata",
                tool_call_id="foo",
            )
        case _:
            raise NotImplementedError


@pytest.mark.parametrize(
    "message",
    [
        "select_dataset",
        "generate_table",
        "generate_table_error",
        "generate_chart_metadata_bar",
        "generate_chart_metadata_map",
        "generate_chart_metadata_error",
    ],
    indirect=True,
)
def test_create_response_message(message: BaseMessage) -> None:
    response_message = atlas_assistant.api.create_response_message(
        message, "a-thread-id"
    )
    assert response_message


@pytest.mark.integration
def test_chat_two_responses(
    client: TestClient,
) -> None:
    response = client.post(
        "/chat",
        json={"query": "What crops are being grown in Kenya?"},
    )
    _ = response.raise_for_status()
    response = client.post(
        "/chat",
        json={"query": "Can you make a bar chart out of that?"},
    )
    _ = response.raise_for_status()
