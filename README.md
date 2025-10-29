# Adaptation Atlas Assistant

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/AdaptationAtlas/adaptation-atlas-assistant/ci.yaml?style=for-the-badge)](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/actions/workflows/ci.yaml)

We're building a standalone app that will generate visualizations and text summaries of Atlas data from a user's natural language prompt.
These visualizations and summaries will be modeled after the stories already in-use on the [Adaptation Atlas](https://adaptationatlas.cgiar.org/).

We track our work on the [project board](https://github.com/orgs/AdaptationAtlas/projects/6).

## Usage

We have a simple chainlit frontend to show what the agent does.
Get [uv](https://docs.astral.sh/uv/getting-started/installation/), then:

```sh
cp .env.example .env
# Set your API key in .env
echo JWT_KEY=$(openssl rand -hex 32) >> .env
uv run python scripts/embed_stac.py
uv run chainlit run chainlit/app.py -w
```

To run the FastAPI application:

```sh
uv run fastapi dev src/atlas_assistant/api.py
```

Navigate to http://127.0.0.1:8000/docs to see OpenAPI documentation for the local server.
Most endpoints should be behind authentication during initial development.

### Updating the datasets

We use the [Atlas's STAC Catalog](https://digital-atlas.s3.amazonaws.com/stac/public_stac/catalog.json) to build our dataset embeddings database.
To re-fetch all items that have parquet assets and rebuild the embeddings:

```sh
uv run python scripts/fetch_stac.py
uv run python scripts/embed_stac.py
```

## Development

```sh
git clone git@github.com:AdaptationAtlas/adaptation-atlas-assistant.git
cd adaptation-atlas-assistant
uv sync
uv run prek install
```

To run the unit tests:

```sh
uv run pytest
```

We have some tests that exercise the agent, which requires access to the LLM model.
To run those, set your API key in `.env`, then:

```sh
uv run pytest --integration
```

To run linters and formatters:

```sh
uv run prek run --all-files
```

To run **pre-commit** automatically:

```sh
uv run pre-commit install
```

If you get sick of adding `uv run` to everything:

```sh
source .venv/bin/activate
```

## Contributing

We use Github [issues](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/issues) to report bugs and open feature requests, and Github [pull requests](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/pulls) to propose code changes.
When you open a pull request, please use the [conventional commit specification](https://www.conventionalcommits.org/en/v1.0.0/) for your title.
