from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pytest import Config, Parser

import atlas_assistant.api
import atlas_assistant.settings
from atlas_assistant.dataset import Dataset, Item
from atlas_assistant.settings import Settings


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
def serialized_data_valid() -> dict[str, Any]:
    """Valid data with categorical and numeric columns."""
    return {
        "columns": ["crop", "total_value"],
        "data": [
            ["maize", 1500.5],
            ["wheat", 1200.3],
            ["rice", 900.7],
        ],
        "column_names": [None, None],
    }


@pytest.fixture
def serialized_data_single_column() -> dict[str, Any]:
    """Data with only categorical column (no numeric data)."""
    return {
        "columns": ["crop"],
        "data": [["maize"], ["wheat"], ["rice"]],
        "column_names": [None],
    }


@pytest.fixture
def serialized_data_empty() -> dict[str, Any]:
    """Valid structure but no data rows."""
    return {
        "columns": ["crop", "total_value"],
        "data": [],
        "column_names": [None, None],
    }


@pytest.fixture
def serialized_data_only_categorical() -> dict[str, Any]:
    """Data where second column is not numeric."""
    return {
        "columns": ["crop", "region"],
        "data": [
            ["maize", "East"],
            ["wheat", "West"],
            ["rice", "North"],
        ],
        "column_names": [None, None],
    }
