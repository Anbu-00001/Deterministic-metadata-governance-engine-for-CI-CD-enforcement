from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # OpenMetadata
    OPENMETADATA_HOST: str = Field(default="http://localhost", description="OpenMetadata Host")
    OPENMETADATA_PORT: int = Field(default=8585, description="OpenMetadata Port")
    OPENMETADATA_JWT_TOKEN: str = Field(description="OpenMetadata JWT Token (required)")

    # Qdrant
    QDRANT_HOST: str = Field(default="localhost", description="Qdrant Host")
    QDRANT_PORT: int = Field(default=6333, description="Qdrant Port")
    QDRANT_COLLECTION_NAME: str = Field(default="hephaestus_embeddings", description="Qdrant Collection Name")

    # GitHub
    GITHUB_TOKEN: str = Field(description="GitHub Token (required)")
    GITHUB_REPO_OWNER: str = Field(description="GitHub Repo Owner (required)")
    GITHUB_REPO_NAME: str = Field(description="GitHub Repo Name (required)")

    # FGS math constants
    FGS_BLOCK_THRESHOLD: float = Field(default=0.6, description="FGS Block Threshold")
    SEMANTIC_DRIFT_THRESHOLD: float = Field(default=0.85, description="Semantic Drift Threshold")
    LAMBDA_DECAY: float = Field(default=0.1, description="Decay factor for Blast Radius")
    ALPHA_STRUCTURAL: float = Field(default=0.7, description="Alpha for Structural Change")
    BETA_VOLUME: float = Field(default=0.3, description="Beta for Volume Change")

    # Embedding
    EMBEDDING_MODEL_NAME: str = Field(default="all-MiniLM-L6-v2", description="Embedding Model Name")

    # Infrastructure
    MYSQL_ROOT_PASSWORD: str = Field(description="MySQL Root Password (required)")
    MYSQL_DATABASE: str = Field(default="openmetadata_db", description="MySQL Database")
    MYSQL_USER: str = Field(default="openmetadata_user", description="MySQL User")
    MYSQL_PASSWORD: str = Field(description="MySQL Password (required)")
    DASHBOARD_ORIGIN: str = Field(default="http://localhost:3000", description="Dashboard Origin")
    REPO_PATH: str = Field(default="/workspace/repo", description="Repo Path")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()
