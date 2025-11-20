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
    return atlas_assistant.settings.get_settings()


@pytest.fixture
def client() -> Iterator[TestClient]:
    def override_oidc() -> str:
        return "token!"

    atlas_assistant.api.app.dependency_overrides[atlas_assistant.api.oidc] = (
        override_oidc
    )

    with TestClient(atlas_assistant.api.app) as client:
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
