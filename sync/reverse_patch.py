"""
Module: reverse_patch.py

Purpose:
Manages reverse sync operations and artifact patching natively inside reverse_patch.py.

Responsibilities:
- Handles specific `reverse_patch.py` domain logic
- Integrates seamlessly with sibling modules
- Adheres strictly to Hephaestus governance constraints

Part of: Hephaestus Governance Engine

Reverse patch — propagate UI edits back to OpenMetadata.

Thin wrapper around :func:`mcp.tools.entity_tools.patch_entity` that
adds structured logging for auditability.
"""

from __future__ import annotations

import logging
from typing import Any

from mcp_server.tools.entity_tools import patch_entity as _patch_entity

logger = logging.getLogger(__name__)


async def reverse_patch(
    entity_type: str,
    entity_id: str,
    patch_ops: list[dict[str, Any]],
) -> dict[str, Any]:
    """Apply a JSON Patch to an OpenMetadata entity with structured logging.

    Args:
        entity_type: OpenMetadata entity kind (e.g. ``"tables"``).
        entity_id: UUID of the entity to patch.
        patch_ops: RFC-6902 JSON Patch operations.

    Returns:
        The patched entity dict from the API.

    Raises:
        RuntimeError: Propagated from the underlying
            :func:`~mcp.tools.entity_tools.patch_entity` on non-2xx.
    """
    logger.info(
        "reverse_patch → %s/%s (%d ops)",
        entity_type,
        entity_id,
        len(patch_ops),
    )

    result = await _patch_entity(entity_type, entity_id, patch_ops)

    logger.info(
        "reverse_patch complete → %s/%s version=%s",
        entity_type,
        entity_id,
        result.get("version", "?"),
    )
    return result

