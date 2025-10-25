"""Fetch items with parquet files from the STAC catalog."""

import json
import urllib.parse
from pathlib import Path
from typing import Any

from httpx import Client

ROOT_URL = "https://digital-atlas.s3.amazonaws.com/stac/public_stac/catalog.json"
ROOT_DIRECTORY = Path(__file__).parents[1]
STAC_DIRECTORY = ROOT_DIRECTORY / "data" / "stac"

STAC_DIRECTORY.mkdir(exist_ok=True)

client = Client()
Value = dict[str, Any]
Item = dict[str, Any]  # we could make this more specific, but don't need to yet


def get(url: str) -> Value:
    response = client.get(url)
    _ = response.raise_for_status()
    return response.json()


def write(item: Item, href: str) -> None:
    for link in item["links"]:
        link["href"] = urllib.parse.urljoin(href, link["href"])
    file_name = href.split("/")[-1]
    with open(STAC_DIRECTORY / file_name, "w") as f:
        json.dump(item, f, indent=2)


def walk(value: Value, url: str) -> None:
    links = value.get("links")
    if isinstance(links, list):
        for link in links:
            absolute_href = urllib.parse.urljoin(url, link["href"])
            rel = link.get("rel")
            match rel:
                case "child":
                    child = get(absolute_href)
                    print(f"Walking into {absolute_href}")
                    walk(child, absolute_href)
                case "item":
                    if not absolute_href.endswith(".tif.json"):
                        item = get(absolute_href)
                        if any(
                            asset.get("type") == "application/vnd.apache.parquet"
                            for asset in item["assets"].values()
                        ):
                            write(item, absolute_href)
                case _:
                    pass


root = get(ROOT_URL)
walk(root, ROOT_URL)
