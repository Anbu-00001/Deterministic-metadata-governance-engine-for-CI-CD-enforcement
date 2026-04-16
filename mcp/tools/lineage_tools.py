"""MCP tools for OpenMetadata lineage graph traversal.

Provides ``get_entity_lineage`` (raw graph fetch) and
``get_downstream_nodes`` (extracted downstream FQN list).
"""

from __future__ import annotations

from typing import Any

import httpx

from config import settings


async def _get_client() -> httpx.AsyncClient:
    """Build an ``httpx.AsyncClient`` preconfigured for OpenMetadata."""
    return httpx.AsyncClient(
        base_url=settings.openmetadata_api_url,
        headers={
            "Authorization": f"Bearer {settings.openmetadata_jwt_token}",
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )


def _raise_on_error(response: httpx.Response, context: str) -> None:
    """Raise a descriptive ``RuntimeError`` for non-2xx responses."""
    if not response.is_success:
        raise RuntimeError(
            f"{context} failed — HTTP {response.status_code}: {response.text}"
        )


async def get_entity_lineage(
    entity_type: str,
    entity_id: str,
    depth: int = 3,
) -> dict[str, Any]:
    """Fetch the lineage graph for an OpenMetadata entity.

    Args:
        entity_type: Entity kind (e.g. ``"tables"``).
        entity_id: UUID of the root entity.
        depth: How many hops downstream to traverse (default 3).

    Returns:
        The full lineage graph JSON as a dict.

    Raises:
        RuntimeError: On non-2xx API response.
    """
    async with await _get_client() as client:
        response = await client.get(
            f"/lineage/{entity_type}/{entity_id}",
            params={"upstreamDepth": 0, "downstreamDepth": depth},
        )
        _raise_on_error(
            response, f"GET /lineage/{entity_type}/{entity_id}"
        )
        return response.json()


async def get_downstream_nodes(
    entity_type: str,
    entity_id: str,
    depth: int = 3,
) -> list[str]:
    """Extract unique downstream node FQNs from the lineage graph.

    Calls :func:`get_entity_lineage` then walks the ``nodes`` list,
    collecting fully-qualified names of every downstream entity.

    Args:
        entity_type: Entity kind.
        entity_id: UUID of the root entity.
        depth: Downstream traversal depth.

    Returns:
        De-duplicated list of downstream entity FQNs.
    """
    graph = await get_entity_lineage(entity_type, entity_id, depth)

    # The lineage response has "nodes" (list of entity refs) and
    # "downstreamEdges" (list of {fromEntity, toEntity}).
    downstream_edge_targets: set[str] = set()
    for edge in graph.get("downstreamEdges", []):
        target_id = edge.get("toEntity", {}).get("id", "") if isinstance(
            edge.get("toEntity"), dict
        ) else edge.get("toEntity", "")
        if target_id:
            downstream_edge_targets.add(target_id)

    # Map IDs → FQNs via the nodes list.
    nodes_by_id: dict[str, str] = {}
    for node in graph.get("nodes", []):
        node_id = node.get("id", "")
        node_fqn = node.get("fullyQualifiedName", node.get("name", node_id))
        if node_id:
            nodes_by_id[node_id] = node_fqn

    return [
        nodes_by_id.get(tid, tid)
        for tid in sorted(downstream_edge_targets)
    ]
