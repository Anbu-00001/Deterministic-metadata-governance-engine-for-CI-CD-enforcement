"""Rollback endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from chronos.rollback import rollback_to_snapshot
from config import settings

router = APIRouter(tags=["rollback"])


class RollbackRequest(BaseModel):
    """Request body for triggering a rollback."""

    snapshot_index: int
    commit_sha: str


@router.post("/rollback")
async def trigger_rollback(
    body: RollbackRequest,
    request: Request,
) -> dict[str, Any]:
    """Roll back the metadata estate to a previous snapshot.

    Args:
        body: Contains ``snapshot_index`` (int) and ``commit_sha`` (str).

    Returns:
        Rollback result with ``status``, ``patched_count``, and ``errors``.

    Raises:
        HTTPException: 404 if snapshot_index is out of range.
    """
    snapshots: list[dict[str, Any]] = request.app.state.snapshots

    if body.snapshot_index < 0 or body.snapshot_index >= len(snapshots):
        raise HTTPException(
            status_code=404,
            detail=(
                f"Snapshot index {body.snapshot_index} not found "
                f"(have {len(snapshots)} snapshots)."
            ),
        )

    snapshot = snapshots[body.snapshot_index]
    result = await rollback_to_snapshot(
        snapshot=snapshot,
        repo_path=settings.repo_path,
        commit_sha=body.commit_sha,
    )
    return result
