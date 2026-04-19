"""
Module: rollback.py

Purpose:
Manages Temporal-style workflows and snapshot states for rollback.py chronological syncs.

Responsibilities:
- Handles specific `rollback.py` domain logic
- Integrates seamlessly with sibling modules
- Adheres strictly to Hephaestus governance constraints

Part of: Hephaestus Governance Engine

Rollback engine — restore metadata estate to a prior snapshot.

Two-stage rollback:
1. **API stage**: Patch each entity back to its snapshotted state via
   :func:`~mcp.tools.entity_tools.patch_entity`.
2. **Git stage**: Revert the specified commit in the local repository
   using ``git revert --no-commit``.
"""

from __future__ import annotations

import logging
from typing import Any

from git import Repo

from mcp_server.tools.entity_tools import patch_entity

logger = logging.getLogger(__name__)


async def rollback_to_snapshot(
    snapshot: dict[str, Any],
    repo_path: str,
    commit_sha: str,
) -> dict[str, Any]:
    """Restore the metadata estate to a previous snapshot.

    Args:
        snapshot: A snapshot dict as returned by
            :func:`~chronos.snapshot.capture_snapshot`.
        repo_path: Local filesystem path to the cloned repository.
        commit_sha: Git commit SHA to revert.

    Returns:
        A result dict::

            {
                "status": "success" | "partial_failure",
                "patched_count": int,
                "errors": [{"entity_id": ..., "error": ...}, ...]
            }
    """
    errors: list[dict[str, str]] = []
    patched_count = 0
    label = snapshot.get("label", "unknown")

    # ── Stage 1: Restore entities via API patches ────────────
    for entity in snapshot.get("entities", []):
        entity_id = entity.get("id", "")
        entity_type = entity.get("_entity_type", "tables")
        if not entity_id:
            continue

        patch_ops: list[dict[str, Any]] = []

        # Restore description.
        if "description" in entity:
            patch_ops.append({
                "op": "replace",
                "path": "/description",
                "value": entity["description"],
            })

        # Restore owner.
        if "owner" in entity and entity["owner"]:
            patch_ops.append({
                "op": "replace",
                "path": "/owner",
                "value": entity["owner"],
            })

        # Restore tags.
        if "tags" in entity:
            patch_ops.append({
                "op": "replace",
                "path": "/tags",
                "value": entity["tags"],
            })

        if not patch_ops:
            continue

        try:
            await patch_entity(entity_type, entity_id, patch_ops)
            patched_count += 1
        except RuntimeError as exc:
            logger.error(
                "Failed to patch %s/%s during rollback: %s",
                entity_type,
                entity_id,
                exc,
            )
            errors.append({"entity_id": entity_id, "error": str(exc)})

    # ── Stage 2: Git revert ──────────────────────────────────
    try:
        repo = Repo(repo_path)
        repo.git.revert(commit_sha, no_commit=True)
        repo.index.commit(
            f"chore(chronos): rollback to snapshot {label}"
        )
        logger.info("Git revert of %s committed successfully.", commit_sha[:8])
    except Exception as exc:
        logger.error("Git revert failed: %s", exc)
        errors.append({"entity_id": "git_revert", "error": str(exc)})

    status = "success" if not errors else "partial_failure"
    return {
        "status": status,
        "patched_count": patched_count,
        "errors": errors,
    }

