from collections.abc import Iterator
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pytest import Config, Parser

import atlas_assistant.api
import atlas_assistant.settings
from atlas_assistant.dataset import Dataset, Item
from atlas_assistant.settings import Settings
from atlas_assistant.state import OutputData
from atlas_assistant.tools.sql import BarChart, BarChartData


@pytest.fixture
def settings() -> Settings:
    settings = atlas_assistant.settings.get_settings()
    # python -c 'from pwdlib import PasswordHash; h = PasswordHash.recommended(); print(h.hash("test-password"))'  # noqa: E501
    settings.users = {
        "test-user": "$argon2id$v=19$m=65536,t=3,p=4$wcrhwu+MkorDhOTHuY6J1w$S3LkpIYNmV7nOg+lgck1Nqfxmtz1ZHrpbQVLrvjhzfI"  # noqa: E501
    }
    return settings


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    def override_get_settings() -> Settings:
        return settings

    atlas_assistant.api.app.dependency_overrides[atlas_assistant.api.get_settings] = (
        override_get_settings
    )
    with TestClient(atlas_assistant.api.app) as client:
        yield client


@pytest.fixture
def authenticated_client(client: TestClient) -> Iterator[TestClient]:
    response = client.post(
        "/token", data={"username": "test-user", "password": "test-password"}
    )
    _ = response.raise_for_status()
    client.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
    yield client


@pytest.fixture
def dataset() -> Dataset:
    with open(
        Path(__file__).parent
        / "data"
        / "haz_exposure_cmip6_ssa_jagermeyr_historic_severe_int.json"
    ) as f:
        item = Item.model_validate_json(f.read())
    return Dataset(item=item, asset_key="data")


def pytest_addoption(parser: Parser) -> None:
    parser.addoption(
        "--integration",
        action="store_true",
        default=False,
        help="run tests that exercise the LLM-backed agent",
    )


def pytest_collection_modifyitems(config: Config, items: Any) -> None:
    if config.getoption("--integration"):
        return
    skip_agent = pytest.mark.skip(reason="need --integration option to run")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_agent)


@pytest.fixture
def output_data_valid() -> OutputData:
    """Valid data with categorical and numeric columns."""
    return OutputData(
        columns=["crop", "total_value"],
        data=[
            ["maize", 1500.5],
            ["wheat", 1200.3],
            ["rice", 900.7],
        ],
        column_names=[None, None],
    )


@pytest.fixture
def output_data_single_column() -> OutputData:
    """Data with only categorical column (no numeric data)."""
    return OutputData(
        columns=["crop"],
        data=[["maize"], ["wheat"], ["rice"]],
        column_names=[None],
    )


@pytest.fixture
def output_data_empty() -> OutputData:
    """Valid structure but no data rows."""
    return OutputData(
        columns=["crop", "total_value"],
        data=[],
        column_names=[None, None],
    )


@pytest.fixture
def output_data_only_categorical() -> OutputData:
    """Data where second column is not numeric."""
    return OutputData(
        columns=["crop", "region"],
        data=[
            ["maize", "East"],
            ["wheat", "West"],
            ["rice", "North"],
        ],
        column_names=[None, None],
    )


@pytest.fixture
def mock_mistral_client():
    """Mock the Mistral client to return a valid BarChart response."""
    with patch("atlas_assistant.tools.sql.Mistral") as mock_mistral:
        # Create a mock chart
        mock_chart = BarChart(
            title="Test Chart",
            category_field="crop",
            value_field="total_value",
            color_domain=["maize", "wheat", "rice"],
            color_range=["#79A1B7", "#195B83"],
            text_color=None,
            values=[
                BarChartData(type="maize", value=1500.5, value_label="1500.5"),
                BarChartData(type="wheat", value=1200.3, value_label="1200.3"),
                BarChartData(type="rice", value=900.7, value_label="900.7"),
            ],
        )

        # Create mock response structure
        mock_message = MagicMock()
        mock_message.parsed = mock_chart

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        # Configure the mock client
        mock_client_instance = MagicMock()
        mock_client_instance.chat.parse.return_value = mock_response
        mock_mistral.return_value = mock_client_instance

        yield mock_mistral
