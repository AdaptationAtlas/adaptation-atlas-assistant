ARG PYTHON_VERSION=3.13

FROM python:${PYTHON_VERSION}-slim AS build

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=0

#0.9.5
COPY --from=ghcr.io/astral-sh/uv@sha256:f459f6f73a8c4ef5d69f4e6fbbdb8af751d6fa40ec34b39a1ab469acd6e289b7 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock README.md /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync \
    --frozen \
    --no-dev \
    --no-editable \
    --no-install-project

COPY src /app/src
COPY data /app/data
COPY logging.yaml /app/logging.yaml

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync \
    --frozen \
    --no-dev \
    --no-editable \
    --compile-bytecode

###################################
# DEVELOPMENT (--target local)
###################################
FROM build AS local

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

ENV PATH=/app/.venv/bin:$PATH

###################################
# PRODUCTION (--target prod)
###################################
FROM python:${PYTHON_VERSION}-slim AS prod

COPY --from=build --chown=app:app /app /app

ENV PYTHONUNBUFFERED=1
ENV PATH=/app/.venv/bin:$PATH

WORKDIR /app
