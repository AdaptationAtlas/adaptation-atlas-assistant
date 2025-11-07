#!/usr/bin/env python3

"""Export the OpenAPI specification from the FastAPI app."""

import json
from pathlib import Path

from atlas_assistant.api import app

ROOT = Path(__file__).parents[1]
OUTPUT_PATH = ROOT / "openapi.json"

openapi_schema = app.openapi()

with open(OUTPUT_PATH, "w") as f:
    json.dump(openapi_schema, f, indent=2)

print(f"OpenAPI specification exported to {OUTPUT_PATH}")
