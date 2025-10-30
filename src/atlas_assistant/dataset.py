"""Datasets are parquet files, as referenced a STAC asset inside of STAC item."""

from __future__ import annotations

import tabulate
from pydantic import BaseModel, ConfigDict, Field


class Item(BaseModel):
    """A STAC item, with only the fields we need."""

    id: str
    """The item id"""

    properties: Properties
    """Item properties"""

    assets: dict[str, Asset]
    """The item's assets"""


class Properties(BaseModel):
    """STAC item properties, the ones we use

    Some fields are required here but are not required on a STAC item.
    """

    description: str
    """A description of the item"""

    table_columns: list[TableColumn] = Field(alias="table:columns")
    """The datasets' schema"""

    sql_instructions: list[str] | None = Field(
        alias="atlas_assistant:sql_instructions", default=None
    )
    """An extra instructions to issue to the LLM when generating SQL for this item"""

    model_config = ConfigDict(serialize_by_alias=True)  # pyright: ignore[reportUnannotatedClassAttribute]


class Asset(BaseModel):
    """A STAC asset, with only the fields we need"""

    href: str
    """The asset's href"""

    type: str | None = None
    """The type of the asset"""

    title: str | None = None
    """an optional title for the asset"""


class TableColumn(BaseModel):
    """A table column, from the table extension: https://github.com/stac-extensions/table"""

    name: str
    """The column name"""

    description: str
    """Detailed multi-line description to explain the dimension. CommonMark 0.29
    syntax MAY be used for rich text representation."""

    type: str
    """Data type of the column. If using a file format with a type system (like
    Parquet), we recommend you use those types.
    """

    values: list[str] | None = None
    """An optional list of values contained in this column.

    This isn't part of the table extension, but is helpful information to feed
    to the LLM.
    """


class Dataset(BaseModel):
    """A parquet dataset, which is an asset.

    We include the item in case we want to look information up there.
    """

    item: Item
    """The item that contains the asset"""

    asset_key: str
    """The key of the asset"""

    @property
    def asset(self) -> Asset:
        """The asset itself, as referenced by the key."""
        return self.item.assets[self.asset_key]

    @property
    def href(self) -> str | None:
        """The asset's href"""
        return self.asset.href

    def get_description(self) -> str:
        """Returns a text description for this dataset."""
        return self.item.properties.description

    def get_schema_table(self) -> str:
        """Returns a markdown-formatted table of this dataset's schema."""
        rows = list(
            [column.name, column.type, column.description]
            for column in self.item.properties.table_columns
        )
        return tabulate.tabulate(rows, headers=["Name", "Type", "Description"])

    # TODO cache
    def get_head_table(self, limit: int = 5) -> str:
        """Returns a formatted table of the first few rows."""
        import duckdb

        return (
            duckdb.sql(f"SELECT * FROM '{self.href}' LIMIT {limit}")
            .to_df()
            .to_string(index=False)
        )

    def to_metadata(self) -> Metadata:
        """Converts this dataset to its metadata representation, for an
        embeddings database."""
        return Metadata(
            item=self.item.model_dump_json(exclude_none=True), asset_key=self.asset_key
        )


class Metadata(BaseModel):
    """Metadata stored in our embeddings database.

    The item and asset are encoded as JSON strings.
    """

    item: str
    """The item as a JSON string"""

    asset_key: str
    """The asset key"""

    def to_dataset(self) -> Dataset:
        """Converts these metadata to a dataset"""
        return Dataset(
            item=Item.model_validate_json(self.item), asset_key=self.asset_key
        )
