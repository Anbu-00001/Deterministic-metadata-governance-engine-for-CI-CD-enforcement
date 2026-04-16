# Hephaestus

**Deterministic metadata governance engine for CI/CD enforcement.**

Hephaestus intercepts every GitHub Pull Request that touches dbt models or SQL
schemas, computes the **Forge Governance Score (FGS)**, and blocks non-compliant
merges.  It maintains bi-directional sync between the OpenMetadata catalog and
code, and provides the Chronos dashboard for point-in-time rollback.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────────┐  │
│  │  PR Trigger   │───▶│   Sentinel     │──▶│  PR Comment  │  │
│  └──────────────┘    │  (FGS Engine)  │   │  PASS/BLOCK  │  │
│                      └──────┬─────────┘   └──────────────┘  │
│                             │                                │
├─────────────────────────────┼───────────────────────────────┤
│                             ▼                                │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────────┐  │
│  │  MCP Server   │◀──│  OpenMetadata  │──▶│   Qdrant     │  │
│  │  (FastMCP)    │   │    1.12        │   │  (Vectors)   │  │
│  └──────────────┘    └────────────────┘   └──────────────┘  │
│                             │                                │
│                             ▼                                │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────────┐  │
│  │  Sync Engine  │◀─▶│   Chronos      │──▶│  FastAPI     │  │
│  │  (Bi-dir)     │   │  (Snapshots)   │   │  Dashboard   │  │
│  └──────────────┘    └────────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Subsystems

| Subsystem | Purpose |
|-----------|---------|
| **Sentinel** | FGS calculation, semantic drift detection, blast-radius analysis |
| **MCP** | FastMCP server translating tool calls to OpenMetadata API |
| **Sync** | Bi-directional metadata sync between catalog and dbt YAML |
| **Chronos** | Point-in-time snapshots, timeline, and rollback engine |
| **API** | FastAPI service exposing timeline, snapshot, and rollback endpoints |
| **Skills** | On-demand governance checks (PII detection, contract validation, lineage mapping) |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hephaestus.git
cd hephaestus

# 2. Configure environment
cp docker/.env.example docker/.env
# Edit docker/.env with your actual values

# 3. Start all services
cd docker
docker compose up -d

# 4. Verify
curl http://localhost:8001/api/health
# → {"status":"ok","version":"0.1.0","service":"hephaestus-api"}
```

### Local Development (without Docker)

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run tests (pure math tests — no network needed)
pytest tests/unit/test_fgs.py tests/unit/test_blast_radius.py tests/unit/test_diff_engine.py -v

# Run the API locally
uvicorn api.main:app --reload --port 8001

# Run the Sentinel CLI
hephaestus-sentinel run-sentinel --pr-number 1 --changed-files "db.default.orders"
```

---

## Environment Variables

All configuration flows through `config/settings.py` (Pydantic BaseSettings).
**Never** access `os.environ` directly in the codebase.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENMETADATA_HOST` | str | `http://localhost` | OpenMetadata server URL |
| `OPENMETADATA_PORT` | int | `8585` | OpenMetadata API port |
| `OPENMETADATA_JWT_TOKEN` | str | — | JWT bearer token |
| `QDRANT_HOST` | str | `localhost` | Qdrant vector store host |
| `QDRANT_PORT` | int | `6333` | Qdrant port |
| `QDRANT_COLLECTION_NAME` | str | `hephaestus_embeddings` | Qdrant collection |
| `GITHUB_TOKEN` | str | — | GitHub access token |
| `GITHUB_REPO_OWNER` | str | — | GitHub org/user |
| `GITHUB_REPO_NAME` | str | — | Repository name |
| `FGS_BLOCK_THRESHOLD` | float | `0.6` | FGS blocking threshold |
| `SEMANTIC_DRIFT_THRESHOLD` | float | `0.85` | Cosine-similarity drift threshold |
| `LAMBDA_DECAY` | float | `0.1` | Blast-radius decay constant |
| `ALPHA_STRUCTURAL` | float | `0.7` | Structural delta weight |
| `BETA_VOLUME` | float | `0.3` | Volume delta weight |
| `EMBEDDING_MODEL_NAME` | str | `all-MiniLM-L6-v2` | Sentence-transformer model |
| `MYSQL_ROOT_PASSWORD` | str | — | MySQL root password |
| `MYSQL_DATABASE` | str | `openmetadata_db` | MySQL database name |
| `MYSQL_USER` | str | `openmetadata_user` | MySQL user |
| `MYSQL_PASSWORD` | str | — | MySQL password |
| `DASHBOARD_ORIGIN` | str | `http://localhost:3000` | CORS origin for dashboard |
| `REPO_PATH` | str | `/workspace/repo` | Local repo path for git ops |

---

## How the Sentinel Works

### Forge Governance Score (FGS)

```
                 Σ(Cᵢ · Tᵢ)
    FGS  =  ─────────────────  −  λ · R_blast
                  Σ(Tᵢ)
```

Where:

- **Cᵢ** = 1 if column *i* has both a description and governance tag, else 0
- **Tᵢ** = tier weight for column *i*'s criticality tier:

  | Tier | Weight |
  |------|--------|
  | 1 (Critical) | 1.0 |
  | 2 (High) | 0.8 |
  | 3 (Medium) | 0.6 |
  | 4 (Low) | 0.4 |
  | 5 (Minimal) | 0.2 |

- **λ** = decay constant (default 0.1)
- **R_blast** = count of unique downstream dependent nodes (BFS over lineage)

**Decision**: If `FGS < threshold` (default 0.6), the PR is **BLOCKED**.

### Semantic Drift Detection

```
              u · v
    SA  =  ─────────
           ‖u‖ · ‖v‖
```

Where *u* = embedding(dbt description), *v* = embedding(catalog description).
If `SA < 0.85`, a **drift event** is flagged.

### Change Magnitude

```
    Δ  =  α · ΔS  +  β · ΔV
```

Where:
- **ΔS** = (added + removed + modified columns) / total columns
- **ΔV** = changed rows / total rows, clamped to [0, 1]
- **α** = 0.7 (structural weight), **β** = 0.3 (volume weight)

---

## Skills Architecture

Skills are governance checks loaded **on-demand** per PR context:

```
sentinel/skills/
├── base_skill.py              # Abstract base class
├── skills_loader.py           # Dynamic discovery + registry
├── pii_detection/skill.py     # PII pattern matching
├── data_contract_validation/  # ODCS 3.1 contract validation
└── lineage_mapping/           # Downstream dependency summary
```

To add a new skill:
1. Create a new directory under `sentinel/skills/`
2. Add `skill.py` implementing `BaseSkill`
3. Add `SKILL.md` documenting the skill
4. The `SkillsLoader` discovers it automatically — **no core file edits needed**

---

## Day-by-Day Build Plan

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **1** | Foundation scaffold | All modules, FGS/drift/blast math, skills framework, API, CI workflows |
| **2** | GitHub integration | PR comment posting, webhook handlers, status checks |
| **3** | Sync engine hardening | Bi-directional sync, conflict resolution, idempotency tests |
| **4** | Semantic drift pipeline | Full embedding pipeline, Qdrant integration, drift alerting |
| **5** | Quality test generation | Auto-infer YAML test defs from schema, commit back to repo |
| **6** | Chronos dashboard (React) | Timeline view, rollback panel, FGS gauge, impact matrix |
| **7** | Advanced skills | Custom skill authoring, skill marketplace, composable checks |
| **8** | Observability | Structured logging, metrics, tracing, health dashboards |
| **9** | Production hardening | Auth middleware, rate limiting, chaos testing, documentation |

---

## Project Structure

```
hephaestus/
├── .github/workflows/        # CI/CD workflows
├── api/                       # FastAPI application
├── chronos/                   # Snapshot, rollback, timeline
├── config/                    # Pydantic settings (single source of truth)
├── contracts/                 # ODCS 3.1 schema and examples
├── docker/                    # Docker Compose + Dockerfiles
├── mcp/                       # FastMCP server and tools
├── sentinel/                  # FGS engine, skills, CLI
├── sync/                      # Bi-directional metadata sync
├── tests/                     # Unit tests and forge drills
├── pyproject.toml             # Project metadata and dependencies
└── README.md                  # This file
```

---

## License

MIT
