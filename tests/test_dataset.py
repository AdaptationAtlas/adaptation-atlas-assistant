import pytest

import atlas_assistant.tools.dataset
from atlas_assistant.dataset import Dataset
from atlas_assistant.settings import Settings


@pytest.mark.integration
def test_load_embeddings(settings: Settings) -> None:
    _ = settings.get_embeddings()


@pytest.mark.integration
def test_search(settings: Settings) -> None:
    search_result = atlas_assistant.tools.dataset.search(
        query="What crops are being grown in Kenya?", settings=settings
    )
    assert search_result.dataset.item.id == "GLW3_livestock_vopPQ"


def test_dataset_description(dataset: Dataset) -> None:
    # Our fixture dataset doesn't have a title
    dataset.item.properties.title = "This is a fake title."
    assert (
        dataset.get_description()
        == "Title: This is a fake title.\nDescription: Simplified boundaries derived GeoBoundaries 6.0.0. These boundaries should not be used for analysis and processing, use the 'harmonized' boundries for that. These boundaries are for visualisations where high resolution vector data is not needed and file size is a restriction.\nAsset key: atlas-region_admin0_simplified_parquet"  # noqa:E501
    )
