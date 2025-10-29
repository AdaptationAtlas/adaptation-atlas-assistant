"""Embed the STAC items"""

import json
import shutil
from pathlib import Path

import dotenv
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings

from atlas_assistant.dataset import Dataset

_ = dotenv.load_dotenv()

ROOT = Path(__file__).parents[1]
DATA_DIRECTORY = ROOT / "data"
STAC_DIRECTORY = DATA_DIRECTORY / "stac"
EMBEDDINGS_DIRECTORY = DATA_DIRECTORY / "embeddings"

texts = []
metadatas = []
for path in STAC_DIRECTORY.glob("*.json"):
    with open(path) as f:
        item = json.load(f)
    for key, asset in item["assets"].items():
        if asset["type"] == "application/vnd.apache.parquet":
            dataset = Dataset(item=item, asset_key=key)
            texts.append(dataset.get_description())
            metadatas.append(
                dataset.to_metadata().model_dump(mode="json", exclude_none=True)
            )

if EMBEDDINGS_DIRECTORY.exists():
    print(f"Removing existing directory: {EMBEDDINGS_DIRECTORY.absolute()}")
    try:
        shutil.rmtree(EMBEDDINGS_DIRECTORY)
        print("Successfully removed!")
    except PermissionError as e:
        print(f"Permission error: {e}")
    except Exception as e:
        print(f"Error: {e}")

embedding = MistralAIEmbeddings(model="mistral-embed")
_ = Chroma.from_texts(
    texts=texts,
    metadatas=metadatas,
    embedding=embedding,
    persist_directory=str(EMBEDDINGS_DIRECTORY),
)
