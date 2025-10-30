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
def dataset() -> Dataset:
    with open(
        Path(__file__).parents[1] / "data" / "stac" / "haz_risk_severe2.json"
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
