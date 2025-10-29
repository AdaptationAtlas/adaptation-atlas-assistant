"""Datasets are parquet files, as referenced a STAC asset inside of STAC item."""

from __future__ import annotations

from pydantic import BaseModel


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


class Asset(BaseModel):
    """A STAC asset, with only the fields we need"""

    href: str
    """The asset's href"""

    title: str | None = None
    """an optional title for the asset"""

    alternate: Alternate | None = None
    """The alternate asset location, which points to s3"""


class Alternate(BaseModel):
    """An alternate asset definition"""

    s3: Asset
    """The asset with an s3 url"""


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
