FROM --platform=linux/amd64 python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN adduser atlas

#0.9.5
COPY --from=ghcr.io/astral-sh/uv@sha256:f459f6f73a8c4ef5d69f4e6fbbdb8af751d6fa40ec34b39a1ab469acd6e289b7 /uv /uvx /bin/

WORKDIR /app

COPY ./pyproject.toml ./uv.lock ./README.md /app/
COPY ./data /app/data
COPY ./chainlit /app/chainlit
COPY ./src /app/src

RUN uv sync --frozen --no-dev

RUN chown -R atlas:atlas /app
USER atlas