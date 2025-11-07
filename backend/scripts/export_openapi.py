#!/usr/bin/env python3

"""Export the OpenAPI specification from the FastAPI app."""

import json
import os
from pathlib import Path

if os.environ.get("GITHUB_ACTIONS") == "true":
    print("Skipping OpenAPI export in GitHub Actions CI environment")
    exit(0)

from atlas_assistant.api import app

ROOT = Path(__file__).parents[1]
OUTPUT_PATH = ROOT / "openapi.json"

openapi_schema = app.openapi()

with open(OUTPUT_PATH, "w") as f:
    json.dump(openapi_schema, f, indent=2)

print(f"OpenAPI specification exported to {OUTPUT_PATH}")
