# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adaptation Atlas Co-Pilot - A climate adaptation AI assistant with two main components:

1. **Frontend**: React 19 + TypeScript + Vite application providing a modern web interface
2. **Backend**: LangGraph-based AI agent that generates visualizations and text summaries of climate adaptation data

The system uses Mistral AI models for chat and code generation, with both a Chainlit interface for development and a React frontend for production use.

## Setup

### Backend Setup

```bash
# Initial setup
git clone git@github.com:AdaptationAtlas/adaptation-atlas-assistant.git
cd adaptation-atlas-assistant
uv sync
uv run pre-commit install

# Configure environment
cp .env.example .env
# Add MISTRAL_API_KEY and set CHAT_MODEL_SIZE (large/medium/small)

# Initialize dataset embeddings (required before first run)
uv run python scripts/embed_datasets.py

# Run the Chainlit UI (for development)
uv run chainlit run app.py -w
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Start development server
npm run dev  # Runs on http://localhost:5173

# Build for production
npm run build
```

Work is tracked on the [project board](https://github.com/orgs/developmentseed/projects/158).

## Essential Commands

### Backend Commands
```bash
# Run all tests (unit tests only)
uv run pytest

# Run tests including agent integration tests (requires LLM access)
uv run pytest --agent

# Run linters and formatters
uv run pre-commit run --all-files

# Activate virtual environment (to skip 'uv run' prefix)
source .venv/bin/activate

# Run Chainlit development server
uv run chainlit run app.py -w
```

### Frontend Commands
```bash
# Development server with hot reload
npm run dev          # http://localhost:5173

# Production build
npm run build        # Output to src/frontend/dist/

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Running Backend Tests
```bash
# Run a single test file
uv run pytest tests/test_agent.py

# Run tests matching a pattern
uv run pytest -k "test_name_pattern"

# Run with verbose output
uv run pytest -v

# Run specific test markers
uv run pytest -m agent  # Same as --agent flag
```

## Architecture

### Frontend Architecture

The React frontend provides a modern web interface with:

- **Three-column layout**: Logo/avatar sidebar, collapsible prompt builder, main content area
- **Component-based architecture**: Modular React components with TypeScript
- **CSS Modules**: Scoped styling with design tokens
- **React 19 features**: React Compiler for automatic optimization
- **Vite bundler**: Fast development and optimized production builds

See [src/frontend/CLAUDE.md](./src/frontend/CLAUDE.md) for detailed frontend documentation.

### Backend Architecture (LangGraph Agent)

The backend uses LangGraph's `create_react_agent` with a custom state schema and two primary tools:

1. **select_dataset** - Searches ChromaDB vector store (Mistral embeddings) to find matching climate datasets from `data/datasets.json`
2. **create_chart** - Generates SQL queries (via Codestral) to extract data from S3 parquet files, then creates Plotly visualizations

**Agent Flow:**
```
User Query → Agent (Mistral chat model) → Tool Selection
                                        ↓
                            select_dataset (ChromaDB similarity search)
                                        ↓
                            create_chart (Codestral generates SQL → DuckDB execution → Codestral generates Plotly code)
                                        ↓
                            Visualization + Response
```

### State Management

Backend state via custom `AgentState` (extends `AgentStatePydantic`):
- `dataset`: Selected dataset metadata from ChromaDB
- `chart_query`: Generated SQL query for data extraction
- `python_code`: Generated Plotly visualization code
- `chart_data`: Processed data for visualization
- `chart`: Final Plotly chart JSON

State is persisted via `InMemorySaver` checkpointer with thread-based conversation history.

### Code Structure

```
# Backend Structure
src/atlas_assistant/
├── agent.py           # LangGraph agent creation and system prompt
├── state.py          # AgentState schema definition
├── settings.py       # Pydantic settings with Mistral API config
└── tools/
    ├── select_dataset.py    # ChromaDB-based dataset retrieval
    └── create_chart.py      # SQL generation + Plotly visualization

# Frontend Structure
src/frontend/
├── src/
│   ├── components/          # React components
│   │   ├── PromptBox/      # Input component with context tags
│   │   └── Welcome/        # Main application layout
│   ├── assets/
│   │   └── icons.tsx       # Icon components
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles and design tokens
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── CLAUDE.md              # Frontend-specific documentation

# Root Level
app.py                # Chainlit UI handlers (@cl.on_chat_start, @cl.on_message)
scripts/
├── embed_datasets.py        # Creates ChromaDB embeddings from datasets.json
└── parquet_analyzer.py      # Utility for analyzing parquet files

data/
├── datasets.json            # Dataset metadata (name, info, S3 path, etc.)
└── atlas-assistant-docs-mistral-index/  # ChromaDB vector store (created by embed_datasets.py)

.chainlit/                   # Chainlit UI configuration
docs/decisions/              # Architectural Decision Records (ADRs)
```

### Key Implementation Details

**Tool Execution:**
- Both tools return `Command` objects to update agent state
- `select_dataset`: Performs similarity search (k=3), returns top match
- `create_chart`: Two-stage LLM process:
  1. Codestral generates SQL → DuckDB executes against S3 parquet
  2. Codestral generates Plotly code → Parsed and executed to create chart

**Data Access:**
- All datasets stored as parquet files in S3 (`s3://digital-atlas/...`)
- DuckDB used for SQL queries directly against S3 (no local downloads)
- Datasets described in `data/datasets.json` with metadata:
  - `key`: Unique identifier for the dataset
  - `active`: Whether the dataset is available for use
  - `info`: Short description for dataset discovery
  - `note`: Detailed context about the dataset (scenarios, variables, usage)
  - `s3`: S3 path to the parquet file
  - `name`: Table name for SQL queries
- ChromaDB indexes the `info` and `note` fields for semantic search during `select_dataset`

**Model Configuration:**
- Chat: `mistral-{size}-latest` (configurable via `CHAT_MODEL_SIZE`)
- Code generation: `codestral-latest` (hardcoded)
- Embeddings: `mistral-embed` (hardcoded)

## Testing Strategy

**pytest markers:**
- Default: Unit tests that don't require LLM calls
- `@pytest.mark.agent`: Integration tests requiring `--agent` flag (uses actual Mistral API)

**Fixtures (tests/conftest.py):**
- `settings`: Returns configured Settings object
- `run_agent`: Async function to invoke agent with a query string

## Development Workflow

### Backend Development

1. **Adding new datasets**:
   - Update `data/datasets.json` with dataset metadata
   - Use `scripts/parquet_analyzer.py` to inspect parquet file schema if needed
   - Run `uv run python scripts/embed_datasets.py` to rebuild embeddings
2. **Modifying agent behavior**: Edit system prompt in `src/atlas_assistant/agent.py`
3. **Adding new tools**: Create in `src/atlas_assistant/tools/`, register in `agent.py` tools list
4. **Chainlit UI changes**: Modify handlers in `app.py` (@cl.on_chat_start, @cl.on_message)

### Frontend Development

1. **Creating components**: Add to `src/frontend/src/components/` with corresponding CSS modules
2. **Styling**: Update design tokens in `index.css` or component-specific `.module.css` files
3. **Icons**: Add new icon components to `src/frontend/src/assets/icons.tsx`
4. **State management**: Currently using local React state; global state management planned

### Integration (Frontend ↔ Backend)

**Planned integration points**:
- RESTful API endpoints for agent interactions
- WebSocket/SSE for real-time chat streaming
- File upload to S3 with presigned URLs
- Authentication via JWT tokens
- Plotly chart data serialization

## Code Quality

### Backend
- **Formatter/Linter**: Ruff (configured in `pyproject.toml`)
- **Pre-commit hooks**:
  - `sync-with-uv`: Ensures uv.lock is up to date
  - `ruff-check`: Auto-fixes lint issues
  - `ruff-format`: Formats code
- **Type checking**: Not currently enforced (no mypy/pyright in pre-commit)
- **Testing**: pytest with optional agent integration tests

### Frontend
- **Linter**: ESLint with TypeScript support
- **TypeScript**: Strict mode enabled with no implicit any
- **Bundler**: Vite with React plugin and React Compiler
- **CSS**: Modules for scoping, design tokens for consistency
- **Testing**: Framework planned (Jest/Vitest + React Testing Library)

### CI/CD
- GitHub Actions runs pre-commit hooks and pytest on push/PR (see `.github/workflows/ci.yaml`)

## Architectural Decisions

Architectural Decision Records (ADRs) are maintained in `docs/decisions/` using the MADR format. When making significant architectural changes:
1. Create a new ADR using one of the templates in `docs/decisions/`
2. Follow the MADR format at https://adr.github.io/madr/
3. Number sequentially (e.g., `0001-my-decision.md`)

## Current Status

### Working
- **Backend**: LangGraph agent with Chainlit interface fully functional
- **Dataset selection**: ChromaDB similarity search operational
- **Visualizations**: SQL query generation and Plotly chart creation working
- **Frontend UI**: Basic layout and components implemented

### In Development
- **Frontend-Backend Integration**: API endpoints not yet connected
- **Real-time streaming**: WebSocket/SSE implementation pending
- **Authentication**: JWT-based auth system planned
- **File uploads**: S3 integration for user data pending

### Planned Features
- Global state management (Redux/Zustand)
- Testing frameworks for frontend
- Production deployment configuration
- User session management
- Chart export functionality

## Environment Variables

Required in `.env`:
- `MISTRAL_API_KEY`: API key for Mistral AI
- `CHAT_MODEL_SIZE`: "large", "medium", or "small" (default: "small")

Optional:
- `CHAT_MODEL_TEMPERATURE`: Float, default 0.0 (deterministic responses)

## Troubleshooting

### Backend Issues

**"Database does not exist" error**: Run `uv run python scripts/embed_datasets.py` to create ChromaDB index

**Import errors**: Ensure you've run `uv sync` and activated the environment

**Agent test failures**: Verify `MISTRAL_API_KEY` is set in `.env` before running `pytest --agent`

**Chainlit not starting**: Check port 8000 is not in use, try `uv run chainlit run app.py -w --port 8001`

### Frontend Issues

**Module not found**: Run `npm install` in the `src/frontend` directory

**Port already in use**: Vite dev server defaults to 5173, change with `npm run dev -- --port 3000`

**TypeScript errors**: Run `npm run build` to see all type errors, fix before committing

**CSS modules not working**: Ensure files are named `*.module.css` and imported correctly
