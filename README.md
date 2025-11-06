# Adaptation Atlas Assistant

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/AdaptationAtlas/adaptation-atlas-assistant/ci.yaml?style=for-the-badge)](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/actions/workflows/ci.yaml)
[![Frontend](https://img.shields.io/github/deployments/adaptationatlas/adaptation-atlas-assistant/github-pages?style=for-the-badge&label=frontend)](https://adaptationatlas.github.io/adaptation-atlas-assistant/)

We're building an app that generates visualizations and text summaries of Adaptation Atlas data using natural language.
These visualizations and summaries will be modeled after the stories already in-use on the [Adaptation Atlas](https://adaptationatlas.cgiar.org/).

## Running

To run these services locally, create a backend environment file and fill in the values (e.g. with your LLM API key):

```sh
cp backend/.env.example backend/.env
# Now, edit backend/.env with your value(s)
```

Get [Docker](https://www.docker.com/), then:

```sh
docker compose up
```

A simple [chainlit](https://docs.chainlit.io/get-started/overview) app for interacting with the agent will be available at http://0.0.0.0:8501.
The docs for our [FastAPI](https://fastapi.tiangolo.com/) server will be available at http://0.0.0.0:8000/docs.

## Contributing

Our [backend/](./backend) and [frontend](./frontend) live in their own directories — see their respective READMEs for details on how to hack on each.

We use Github [issues](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/issues) to report bugs and open feature requests, and Github [pull requests](https://github.com/AdaptationAtlas/adaptation-atlas-assistant/pulls) to propose code changes.
When you open a pull request, please use the [conventional commit specification](https://www.conventionalcommits.org/en/v1.0.0/) for your title.
