"""Datasets are parquet files, as referenced a STAC asset inside of STAC item."""

from __future__ import annotations

import itertools

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
    """STAC item properties, the ones we use"""

    description: str | None = None
    """An optional description of the item"""

    title: str | None = None
    """An optional title for the item"""

    table_columns: list[TableColumn] | None = Field(alias="table:columns", default=None)
    """The datasets' schema"""


class Asset(BaseModel):
    """A STAC asset, with only the fields we need"""

    href: str
    """The asset's href"""

    type: str | None = None
    """The type of the asset"""

    title: str | None = None
    """an optional title for the asset"""

    alternate: Alternate | None = None
    """The alternate asset location, which points to s3"""


class Alternate(BaseModel):
    """An alternate asset definition"""

    s3: Asset
    """The asset with an s3 url"""


class TableColumn(BaseModel):
    """A table column, from the table extension: https://github.com/stac-extensions/table"""

    name: str
    """The column name"""

    description: str | None = None
    """Detailed multi-line description to explain the dimension. CommonMark 0.29
    syntax MAY be used for rich text representation."""

    type: str = Field(validation_alias="col_type")
    """Data type of the column. If using a file format with a type system (like
    Parquet), we recommend you use those types.

    The value should be `type`, but some existing Atlas STAC have `col_type`.
    """

    model_config = ConfigDict(validate_by_alias=True, validate_by_name=True)  # pyright: ignore[reportUnannotatedClassAttribute]


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
    def s3_href(self) -> str | None:
        """The asset's s3 href"""
        if alternate := self.asset.alternate:
            # Some s3 urls have an extra slash in the path, which breaks
            # requests. This is some opaque voodoo that keeps the double slash
            # between the scheme and the netloc, but removes all other double
            # slashes.
            parts = alternate.s3.href.split("/")
            return "/".join(
                itertools.chain(parts[0:2], (part for part in parts[2:] if part))
            )
        else:
            return None

    def get_description(self) -> str:
        """Returns a text description for this dataset."""
        elements = []
        if title := self.item.properties.title:
            elements.append("Title: " + title)
        if description := self.item.properties.description:
            elements.append("Description: " + description)
        else:
            elements.append("ID: " + self.item.id)
        if asset_title := self.asset.title:
            elements.append("Asset title: " + asset_title)
        else:
            elements.append("Asset key: " + self.asset_key)
        return "\n".join(elements)

    # TODO cache, at least the DuckDB branch
    def get_schema_table(self) -> str:
        """Returns a markdown-formatted table of this dataset's schema."""
        if table_columns := self.item.properties.table_columns:
            rows = list(
                [column.name, column.type, column.description]
                for column in table_columns
            )
        elif s3_href := self.s3_href:
            import duckdb

            result = duckdb.sql(f"DESCRIBE '{s3_href}'").fetchall()
            rows = list([row[0], row[1], None] for row in result)
        else:
            raise ValueError(
                "STAC item does not have the table extension, and the asset does not "
                "have an s3 href"
            )
        return tabulate.tabulate(rows, headers=["Name", "Type", "Description"])

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
