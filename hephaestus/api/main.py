from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

from config.settings import settings
from sentinel.fgs import ColumnMetadata
from sentinel.blast_radius import LineageGraph
from sentinel.diff_engine import SchemaChange, VolumeChange
from sentinel.sentinel import Sentinel, SentinelInput

from chronos.snapshots import create_snapshot, rollback

app = FastAPI(title="Hephaestus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.DASHBOARD_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ColumnMetadataModel(BaseModel):
    name: str
    description: str
    governance_tags: list[str]
    tier: int

class SchemaChangeModel(BaseModel):
    added_columns: int
    removed_columns: int
    modified_columns: int
    total_columns_before: int

class VolumeChangeModel(BaseModel):
    changed_rows: int
    total_rows: int

class LineageGraphModel(BaseModel):
    edges: dict[str, list[str]]

class SentinelInputModel(BaseModel):
    pr_number: int
    changed_tables: list[str]
    column_metadata: dict[str, list[ColumnMetadataModel]]
    lineage_graph: LineageGraphModel
    schema_changes: dict[str, SchemaChangeModel]
    volume_changes: dict[str, VolumeChangeModel]

class SnapshotRequest(BaseModel):
    table_fqn: str
    metadata: dict[str, Any]

class RollbackRequest(BaseModel):
    table_fqn: str
    snapshot_id: str

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.1.0", "service": "hephaestus-api"}

@app.post("/api/sentinel/evaluate")
def evaluate(payload: SentinelInputModel):
    edges = {k: set(v) for k, v in payload.lineage_graph.edges.items()}
    lineage_graph = LineageGraph(edges=edges)
    
    col_meta = {}
    for table_fqn, cols in payload.column_metadata.items():
        col_meta[table_fqn] = [
            ColumnMetadata(name=c.name, description=c.description, governance_tags=c.governance_tags, tier=c.tier)
            for c in cols
        ]
        
    schema_meta = {
        k: SchemaChange(added_columns=v.added_columns, removed_columns=v.removed_columns, modified_columns=v.modified_columns, total_columns_before=v.total_columns_before)
        for k, v in payload.schema_changes.items()
    }
    
    volume_meta = {
        k: VolumeChange(changed_rows=v.changed_rows, total_rows=v.total_rows)
        for k, v in payload.volume_changes.items()
    }
    
    s_in = SentinelInput(
        pr_number=payload.pr_number,
        changed_tables=payload.changed_tables,
        column_metadata=col_meta,
        lineage_graph=lineage_graph,
        schema_changes=schema_meta,
        volume_changes=volume_meta
    )
    
    sentinel = Sentinel()
    decision = sentinel.evaluate(s_in)
    
    return decision

@app.get("/api/timeline")
def timeline(table_fqn: str, limit: int = 20):
    from chronos.snapshots import get_snapshots
    return get_snapshots(table_fqn, limit)

@app.post("/api/snapshot")
def api_snapshot(payload: SnapshotRequest):
    return create_snapshot(payload.table_fqn, payload.metadata)

@app.post("/api/rollback")
def api_rollback(payload: RollbackRequest):
    return rollback(payload.table_fqn, payload.snapshot_id)
