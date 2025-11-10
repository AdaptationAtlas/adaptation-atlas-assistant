from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

import atlas_assistant.api
import atlas_assistant.settings
from atlas_assistant.dataset import Dataset, Item
from atlas_assistant.settings import Settings


@pytest.fixture
def settings() -> Settings:
    settings = atlas_assistant.settings.get_settings()
    settings.mistral_api_key = SecretStr("dummy-key")
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


@pytest.fixture(scope="module")
def vcr_config():
    return {"filter_headers": ["authorization"]}
