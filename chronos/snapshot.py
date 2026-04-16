"""State snapshot capture for the entire metadata estate.

Fetches all tables, dashboards, and ML models from OpenMetadata and
packages them into a timestamped snapshot dict.  The snapshot is returned
to the caller (the API layer handles persistence).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from mcp.tools.entity_tools import list_entities


async def capture_snapshot(label: str) -> dict[str, Any]:
    """Capture a full metadata estate snapshot.

    Fetches tables, dashboards, and ML-model entities from OpenMetadata
    and returns them as a single timestamped dict.

    Args:
        label: Human-readable label for the snapshot
            (e.g. ``"pre-v2-migration"``).

    Returns:
        A snapshot dict with keys:
        - ``label`` — the provided label.
        - ``timestamp`` — ISO-8601 UTC timestamp.
        - ``entities`` — flat list of entity dicts.
    """
    entity_types = ["tables", "dashboards", "mlmodels"]
    all_entities: list[dict[str, Any]] = []

    for etype in entity_types:
        try:
            entities = await list_entities(
                entity_type=etype,
                fields="name,description,owner,tags",
            )
            for entity in entities:
                entity["_entity_type"] = etype
            all_entities.extend(entities)
        except RuntimeError:
            # A missing entity type should not abort the entire snapshot.
            pass

    return {
        "label": label,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entities": all_entities,
    }
