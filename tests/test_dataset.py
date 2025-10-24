import pytest

import atlas_assistant.dataset
from atlas_assistant.settings import Settings


@pytest.mark.integration
def test_load_embeddings(settings: Settings) -> None:
    _ = settings.get_embeddings()


@pytest.mark.integration
def test_search(settings: Settings) -> None:
    search_result = atlas_assistant.dataset.search(
        query="What crops are being grown in Kenya?", settings=settings
    )
    assert search_result.dataset.item.id == "admin2_simplified"
