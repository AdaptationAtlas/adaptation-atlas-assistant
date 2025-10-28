from pathlib import Path

import pytest

import atlas_assistant.tools.dataset
from atlas_assistant.dataset import Dataset, Item
from atlas_assistant.settings import Settings


@pytest.mark.integration
def test_load_embeddings(settings: Settings) -> None:
    _ = settings.get_embeddings()


@pytest.mark.integration
def test_search(settings: Settings) -> None:
    search_result = atlas_assistant.tools.dataset.search(
        query="What crops are being grown in Kenya?", settings=settings
    )
    assert search_result.dataset.item.id == "haz_risk_severe2"


def test_dataset_description(dataset: Dataset) -> None:
    # Our fixture dataset doesn't have a title
    dataset.item.properties.title = "This is a fake title."
    assert (
        dataset.get_description() == "Title: This is a fake title.\n"
        "Description: Crop and livestock exposure data\nAsset key: data"
    )


@pytest.mark.parametrize(
    "path", (Path(__file__).parents[1] / "data" / "stac").glob("*.json")
)
def test_validate_items(path: Path) -> None:
    """We want to make sure our simple item model works for all of the examples"""
    with open(path) as f:
        _ = Item.model_validate_json(f.read())


def test_schema_table(dataset: Dataset) -> None:
    assert (
        dataset.get_schema_table()
        == """Name         Type     Description
-----------  -------  -----------------------------
admin0_name  VARCHAR  Name of Country (admin 0)
value        DOUBLE   The exposure value
scenario     VARCHAR  The climate scenario
timeframe    VARCHAR  The timeframe of the exposure
hazard       VARCHAR  The type of hazard
hazard_vars  VARCHAR  The hazard variables
crop         VARCHAR  The type of crop or livestock
severity     VARCHAR  The severity of the exposure
exposure     VARCHAR  The type of exposure
admin1_name  VARCHAR  Name of the admin 1 region"""
    )


def test_schema_table_without_extension(
    dataset: Dataset,
) -> None:
    dataset.item.properties.table_columns = None
    print(dataset.get_schema_table())
    assert (
        dataset.get_schema_table()
        == """Name         Type     Description
-----------  -------  -------------
admin0_name  VARCHAR
value        DOUBLE
scenario     VARCHAR
timeframe    VARCHAR
hazard       VARCHAR
hazard_vars  VARCHAR
crop         VARCHAR
severity     VARCHAR
exposure     VARCHAR
admin1_name  VARCHAR"""
    )


def test_s3_url_cleaning(dataset: Dataset) -> None:
    asset = dataset.item.assets["data"]
    assert asset.alternate
    asset.alternate.s3.href = "s3://digital-atlas//exposure/livestock/processed/livestock_vop_usd17_adm0.parquet"
    assert (
        dataset.s3_href
        == "s3://digital-atlas/exposure/livestock/processed/livestock_vop_usd17_adm0.parquet"
    )
