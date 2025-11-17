import pytest
from fastapi.testclient import TestClient
from langchain.messages import ToolMessage
from langgraph.graph.message import BaseMessage
from pytest import FixtureRequest

import atlas_assistant.api
from atlas_assistant.dataset import Dataset
from atlas_assistant.state import BarChartMetadata


def test_unauthorized(client: TestClient) -> None:
    response = client.get("/me")
    assert response.status_code == 401


def test_login(client: TestClient) -> None:
    response = client.post(
        "/token", data={"username": "test-user", "password": "test-password"}
    )
    _ = response.raise_for_status()


@pytest.mark.integration
@pytest.mark.parametrize("headers", [None, {"accept": "text/event-stream"}])
def test_chat(authenticated_client: TestClient, headers: dict[str, str] | None) -> None:
    response = authenticated_client.post(
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
        case "generate_bar_chart_metadata":
            return ToolMessage(
                name="generate_bar_chart_metadata",
                tool_call_id="foo",
                artifact=BarChartMetadata(
                    title="A title",
                    x_column="foo",
                    y_column="bar",
                    grouping_column=None,
                ),
            )
        case "generate_bar_chart_metadata_error":
            return ToolMessage(
                name="generate_bar_chart_metadata",
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
        "generate_bar_chart_metadata",
        "generate_bar_chart_metadata_error",
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
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post(
        "/chat",
        json={"query": "What crops are being grown in Kenya?"},
    )
    _ = response.raise_for_status()
    response = authenticated_client.post(
        "/chat",
        json={"query": "Can you make a bar chart out of that?"},
    )
    _ = response.raise_for_status()
