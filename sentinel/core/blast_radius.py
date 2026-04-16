"""Blast-radius calculation from OpenMetadata lineage graphs.

Performs BFS over the lineage graph JSON response to count all unique
downstream dependent nodes (tables, dashboards, ML models, etc.).
"""

from __future__ import annotations

from collections import deque
from typing import Any


def calculate_blast_radius(lineage_graph: dict[str, Any]) -> int:
    """Count unique downstream nodes reachable from the root entity.

    Walks ``downstreamEdges`` using BFS, collecting every unique
    ``toEntity`` id encountered.  The root entity itself is **not**
    included in the count.

    Args:
        lineage_graph: Raw JSON response from the OpenMetadata lineage API.
            Expected keys: ``entity`` (root), ``nodes``, ``downstreamEdges``.

    Returns:
        ``R_blast`` — the integer count of unique downstream dependent nodes.
        Returns ``0`` if the graph has no downstream edges or the expected
        keys are missing.
    """
    downstream_edges: list[dict[str, Any]] = lineage_graph.get("downstreamEdges", [])
    if not downstream_edges:
        return 0

    # Build an adjacency list: fromEntity → [toEntity, …]
    adjacency: dict[str, list[str]] = {}
    for edge in downstream_edges:
        from_id = _extract_id(edge.get("fromEntity"))
        to_id = _extract_id(edge.get("toEntity"))
        if from_id and to_id:
            adjacency.setdefault(from_id, []).append(to_id)

    # Determine the root entity id.
    root_entity: dict[str, Any] | str = lineage_graph.get("entity", {})
    root_id = _extract_id(root_entity)
    if not root_id:
        # Fallback: use any node that appears as a "from" but not as a "to"
        all_to_ids = {_extract_id(e.get("toEntity")) for e in downstream_edges}
        candidates = set(adjacency.keys()) - all_to_ids
        root_id = next(iter(candidates), next(iter(adjacency), ""))

    # BFS from root.
    visited: set[str] = set()
    queue: deque[str] = deque()

    for neighbour in adjacency.get(root_id, []):
        if neighbour not in visited:
            visited.add(neighbour)
            queue.append(neighbour)

    while queue:
        current = queue.popleft()
        for neighbour in adjacency.get(current, []):
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)

    return len(visited)


def _extract_id(entity_ref: Any) -> str:
    """Extract the entity ID from either a dict ``{"id": …}`` or a bare string."""
    if isinstance(entity_ref, dict):
        return str(entity_ref.get("id", ""))
    if isinstance(entity_ref, str):
        return entity_ref
    return ""
