# Adaptation Atlas Assistant

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/AdaptationAtlas/adaptation-atlas-assistant/ci.yaml?style=for-the-badge)](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/actions/workflows/ci.yaml)

We're building a standalone app that will generate visualizations and text summaries of Atlas data from a user's natural language prompt.
These visualizations and summaries will be modeled after the stories already in-use on the [Adaptation Atlas](https://adaptationatlas.cgiar.org/).

We track our work on the [project board](https://github.com/orgs/developmentseed/projects/158).

## Usage

We have a simple chainlit frontend to show what the agent does.
Get [uv](https://docs.astral.sh/uv/getting-started/installation/), then:

```bash
cp .env.example .env
# Set your API key in .env
uv run python src/atlas_assistant/embed_datasets.py
uv run chainlit run src/atlas_assistant/app.py -w
```

## Development

```sh
git clone git@github.com:AdaptationAtlas/adaptation-atlas-assistant.git
cd adaptation-atlas-assistant
uv sync
uv run pre-commit install
```

To run linters and formatters:

```sh
uv run pre-commit run --all-files
```

If you get sick of adding `uv run` to everything:

```sh
source .venv/bin/activate
```
