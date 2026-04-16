"""Timeline and snapshot endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from chronos.snapshot import capture_snapshot
from chronos.timeline import build_timeline

router = APIRouter(tags=["timeline"])


class SnapshotCreateRequest(BaseModel):
    """Request body for creating a new snapshot."""

    label: str


@router.get("/timeline")
async def get_timeline(request: Request) -> list[dict[str, Any]]:
    """Return the full snapshot timeline, sorted newest-first.

    Each entry is enriched with an ``age_human`` field
    (e.g. ``"2 hours ago"``).
    """
    snapshots: list[dict[str, Any]] = request.app.state.snapshots
    return build_timeline(snapshots)


@router.post("/snapshot")
async def create_snapshot(
    body: SnapshotCreateRequest,
    request: Request,
) -> dict[str, Any]:
    """Capture a new metadata estate snapshot.

    Args:
        body: Must contain a ``label`` string.

    Returns:
        The newly created snapshot dict.
    """
    snapshot = await capture_snapshot(label=body.label)
    request.app.state.snapshots.append(snapshot)
    return snapshot


@router.get("/snapshot/{index}")
async def get_snapshot(index: int, request: Request) -> dict[str, Any]:
    """Retrieve a specific snapshot by its list index.

    Args:
        index: Zero-based index into the snapshots list.

    Returns:
        The snapshot dict at the given index.

    Raises:
        HTTPException: 404 if the index is out of range.
    """
    snapshots: list[dict[str, Any]] = request.app.state.snapshots
    if index < 0 or index >= len(snapshots):
        raise HTTPException(
            status_code=404,
            detail=f"Snapshot index {index} not found (have {len(snapshots)} snapshots).",
        )
    return snapshots[index]
