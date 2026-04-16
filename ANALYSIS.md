# Project Configuration Analysis

This document provides a technical overview of the Docker and YAML configurations used in the Hephaestus governance engine.

## 1. Docker Infrastructure

The project uses Docker to provide a standardized, reproducible environment for the entire metadata governance stack.

### Orchestration (`docker-compose.yml`)
- **OpenMetadata Stack**: Leverages `mysql:8` for the database and `elasticsearch:8.10.4` for indexing. These are the core dependencies for `openmetadata/server:1.12.0`.
- **Vector Intelligence**: Includes `qdrant/qdrant` as the vector database used for semantic drift detection (comparing dbt descriptions with catalog metadata).
- **Core Services**:
    - `hephaestus-api`: A FastAPI service that serves the Chronos dashboard and provides rollback/snapshot capabilities.
    - `mcp-server`: A FastMCP server that translates LLM/Agent tool calls into OpenMetadata API actions, enabling the "Sentinel" to interact with the catalog.
- **Service Resilience**: Uses Docker health checks (`mysqladmin ping`, `curl` for ES) to ensure dependent services like `openmetadata-server` only start once their backends are healthy.

### Containerization (`Dockerfile.api`, `Dockerfile.mcp`)
- **Base Image**: Uses `python:3.11-slim` to keep the image size minimal.
- **Dependency Management**: Installs the project in editable mode (`pip install -e .`), allowing for easy development and consistent runtime behavior across containers.

## 2. YAML Configurations

### CI/CD Workflows (`.github/workflows/`)
- **Compliance Sentinel**: Triggered on Pull Requests. It dynamically calculates file changes between the PR and the base branch, then runs the `hephaestus-sentinel` CLI to compute the Forge Governance Score (FGS).
- **Chronos Sync**: Likely handles periodic or event-driven synchronization between the codebase and the OpenMetadata catalog.

### Data Governance Contracts (`contracts/`)
- **ODCS 3.1 Schema**: Uses YAML to define the "rules of the game" for data contracts. It mandates fields like `datasetName`, `version`, `owner`, and `columns`.
- **Validation Logic**: The `data_contract_validation` skill uses this schema to ensure any new dbt models or SQL schemas meet the organization's governance standards before they are merged.

## 3. Environment Lifecycle
Configuration is strictly managed via `.env` files and Pydantic settings. The `docker/.env.example` provides a template for all required integrations (OpenMetadata tokens, GitHub credentials, Qdrant settings), ensuring that zero hardcoded secrets exist in the codebase.
