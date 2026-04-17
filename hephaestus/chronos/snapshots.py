from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
import uuid

@dataclass
class Snapshot:
    snapshot_id: str
    table_fqn: str
    created_at: datetime
    metadata: dict[str, Any]
    commit_sha: str | None

class SnapshotStore:
    """Interface for point-in-time snapshot storage. Day 1: in-memory only."""
    
    def __init__(self):
        self._store: dict[str, list[Snapshot]] = {}
        
    def save(self, snapshot: Snapshot):
        if snapshot.table_fqn not in self._store:
            self._store[snapshot.table_fqn] = []
        self._store[snapshot.table_fqn].append(snapshot)
        
    def get_all(self, table_fqn: str, limit: int = 20) -> list[Snapshot]:
        snaps = self._store.get(table_fqn, [])
        return sorted(snaps, key=lambda x: x.created_at, reverse=True)[:limit]

    def get(self, table_fqn: str, snapshot_id: str) -> Snapshot | None:
        snaps = self._store.get(table_fqn, [])
        for snap in snaps:
            if snap.snapshot_id == snapshot_id:
                return snap
        return None

_store = SnapshotStore()

def create_snapshot(table_fqn: str, metadata: dict[str, Any], commit_sha: str | None = None) -> Snapshot:
    snapshot = Snapshot(
        snapshot_id=str(uuid.uuid4()),
        table_fqn=table_fqn,
        created_at=datetime.now(timezone.utc),
        metadata=metadata,
        commit_sha=commit_sha
    )
    _store.save(snapshot)
    return snapshot

def get_snapshots(table_fqn: str, limit: int = 20) -> list[Snapshot]:
    return _store.get_all(table_fqn, limit)

def rollback(table_fqn: str, snapshot_id: str) -> dict[str, str]:
    snap = _store.get(table_fqn, snapshot_id)
    if not snap:
        raise ValueError(f"Snapshot {snapshot_id} not found for table {table_fqn}")
    return {"status": "ok", "rolled_back_to": snapshot_id}
