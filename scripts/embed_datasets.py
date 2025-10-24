import json
from pathlib import Path

import dotenv
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings

root = Path(__file__).parents[1]

with open(root / "data" / "datasets.json") as f:
    datasets = json.load(f)

dotenv.load_dotenv()

embedder = MistralAIEmbeddings(model="mistral-embed")

data_dir = Path(root / "data").absolute()

docs = []
metadatas = []
for ds in datasets:
    docs.append(f"Name: {ds['name']}, Info: {ds['info']}, Note: {ds['note']}")
    metadatas.append(ds)


Chroma.from_texts(
    texts=docs,
    embedding=embedder,
    metadatas=metadatas,
    persist_directory=str(data_dir / "atlas-assistant-docs-mistral-index"),
)
