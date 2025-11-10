#!/usr/bin/env python3

"""Embed the STAC items"""

import shutil
from pathlib import Path

import dotenv
import pystac
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings
from pystac import Catalog

from atlas_assistant.dataset import Dataset, Item
from atlas_assistant.settings import get_settings

settings = get_settings()
_ = dotenv.load_dotenv()

ROOT = Path(__file__).parents[1]
DATA_DIRECTORY = ROOT / "data"
EMBEDDINGS_DIRECTORY = DATA_DIRECTORY / "embeddings"

texts = []
metadatas = []

catalog = pystac.read_file(settings.stac_catalog_href)
assert isinstance(catalog, Catalog)
for item in catalog.get_items(recursive=True):
    for key, asset in item.assets.items():
        if asset.media_type == "application/vnd.apache.parquet":
            pydantic_item = Item.model_validate(item.to_dict(transform_hrefs=False))
            dataset = Dataset(item=pydantic_item, asset_key=key)
            texts.append(dataset.get_description())
            metadatas.append(
                dataset.to_metadata().model_dump(
                    mode="json",
                    exclude_none=True,
                )
            )
print(f"Found {len(texts)} items")

if EMBEDDINGS_DIRECTORY.exists():
    shutil.rmtree(EMBEDDINGS_DIRECTORY)

embedding = MistralAIEmbeddings(model="mistral-embed")
_ = Chroma.from_texts(
    texts=texts,
    metadatas=metadatas,
    embedding=embedding,
    persist_directory=str(EMBEDDINGS_DIRECTORY),
)

print(f"Embeddings created at {EMBEDDINGS_DIRECTORY}")
