"""
Module: settings.py

Purpose:
Maintains base configuration and environment settings for settings.py.

Responsibilities:
- Handles specific `settings.py` domain logic
- Integrates seamlessly with sibling modules
- Adheres strictly to Hephaestus governance constraints

Part of: Hephaestus Governance Engine

Hephaestus settings — single source of truth for all configuration.

All values are loaded from environment variables (or a .env file).
No module in the project should import ``os.environ`` directly;
use ``from config import settings`` instead.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings
from pydantic import Field


class HephaestusSettings(BaseSettings):
    """Central configuration for all Hephaestus subsystems.

    Values are resolved in this order:
    1. Explicit environment variables
    2. ``.env`` file in the project root
    3. Defaults defined below
    """

    # ── OpenMetadata connection ──────────────────────────────
    openmetadata_host: str = Field(
        default="http://localhost",
        description="Base URL of the OpenMetadata server (scheme + host, no port).",
    )
    openmetadata_port: int = Field(
        default=8585,
        description="Port for the OpenMetadata REST API.",
    )
    openmetadata_jwt_token: str = Field(
        default="",
        description="JWT bearer token for authenticating with OpenMetadata.",
    )

    # ── Qdrant vector store ──────────────────────────────────
    qdrant_host: str = Field(
        default="localhost",
        description="Hostname of the Qdrant vector-search server.",
    )
    qdrant_port: int = Field(
        default=6333,
        description="gRPC / REST port for Qdrant.",
    )
    qdrant_collection_name: str = Field(
        default="hephaestus_embeddings",
        description="Name of the Qdrant collection used for embedding storage.",
    )

    # ── GitHub ───────────────────────────────────────────────
    github_token: str = Field(
        default="",
        description="GitHub personal-access or app token.",
    )
    github_repo_owner: str = Field(
        default="",
        description="GitHub organisation or user that owns the target repo.",
    )
    github_repo_name: str = Field(
        default="",
        description="Name of the target GitHub repository.",
    )

    # ── Sentinel thresholds ──────────────────────────────────
    fgs_block_threshold: float = Field(
        default=0.6,
        description="FGS scores below this value block the PR.",
    )
    semantic_drift_threshold: float = Field(
        default=0.85,
        description="Cosine-similarity below this triggers a drift event.",
    )
    lambda_decay: float = Field(
        default=0.1,
        description="Decay constant λ applied to blast-radius penalty.",
    )
    alpha_structural: float = Field(
        default=0.7,
        description="Weight α for structural delta in change-magnitude formula.",
    )
    beta_volume: float = Field(
        default=0.3,
        description="Weight β for volume delta in change-magnitude formula.",
    )

    # ── Embedding model ──────────────────────────────────────
    embedding_model_name: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence-transformer model name for semantic-drift detection.",
    )

    # ── MySQL (OpenMetadata backend) ─────────────────────────
    mysql_root_password: str = Field(
        default="",
        description="Root password for the MySQL instance backing OpenMetadata.",
    )
    mysql_database: str = Field(
        default="openmetadata_db",
        description="MySQL database name.",
    )
    mysql_user: str = Field(
        default="openmetadata_user",
        description="MySQL application user.",
    )
    mysql_password: str = Field(
        default="",
        description="Password for the MySQL application user.",
    )

    # ── API / Dashboard ──────────────────────────────────────
    dashboard_origin: str = Field(
        default="http://localhost:3000",
        description="Allowed CORS origin for the Chronos dashboard.",
    )
    repo_path: str = Field(
        default="/workspace/repo",
        description="Local filesystem path to the cloned repository.",
    )

    # ── Derived helpers ──────────────────────────────────────
    gemini_api_key: str | None = Field(
        default=None,
        description="Gemini API key for AI smart suggestions.",
    )

    @property
    def openmetadata_api_url(self) -> str:
        """Fully-qualified base URL for OpenMetadata REST API calls."""
        return f"{self.openmetadata_host}:{self.openmetadata_port}/api/v1"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


# Module-level singleton — import this everywhere.
settings = HephaestusSettings()

