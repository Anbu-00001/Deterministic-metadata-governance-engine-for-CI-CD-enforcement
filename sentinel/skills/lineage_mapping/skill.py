"""Lineage mapping governance skill.

Extracts a structured downstream-dependency summary from the
OpenMetadata lineage graph.
"""

from __future__ import annotations

from typing import Any

from sentinel.skills.base_skill import BaseSkill


class LineageMappingSkill(BaseSkill):
    """Produce a structured summary of downstream lineage nodes.

    Always applicable — downstream impact is relevant to every governance
    check.

    Attributes:
        name: ``"lineage_mapping"``
        description: Short description of the skill's purpose.
    """

    name: str = "lineage_mapping"
    description: str = "Maps downstream dependencies from the lineage graph."

    async def is_applicable(self, context: dict[str, Any]) -> bool:
        """Always returns ``True`` — lineage context is universally useful.

        Args:
            context: PR-scoped context dict (unused).

        Returns:
            ``True``.
        """
        return True

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Extract downstream nodes from ``context["lineage_graph"]``.

        Args:
            context: Must contain ``"lineage_graph"`` — the raw JSON
                response from the OpenMetadata lineage API.

        Returns:
            ``{"downstream_count": int, "downstream_nodes": [{"name": …, "type": …}, …]}``
        """
        lineage_graph: dict[str, Any] = context.get("lineage_graph", {})
        nodes: list[dict[str, Any]] = lineage_graph.get("nodes", [])
        downstream_edges: list[dict[str, Any]] = lineage_graph.get("downstreamEdges", [])

        # Collect IDs of all downstream targets.
        downstream_ids: set[str] = set()
        for edge in downstream_edges:
            to_entity = edge.get("toEntity")
            if isinstance(to_entity, dict):
                entity_id = to_entity.get("id", "")
            elif isinstance(to_entity, str):
                entity_id = to_entity
            else:
                continue
            if entity_id:
                downstream_ids.add(entity_id)

        # Build a lookup from node ID → metadata.
        nodes_by_id: dict[str, dict[str, Any]] = {}
        for node in nodes:
            nid = node.get("id", "")
            if nid:
                nodes_by_id[nid] = node

        # Assemble the structured summary.
        downstream_nodes: list[dict[str, str]] = []
        for did in sorted(downstream_ids):
            node_meta = nodes_by_id.get(did, {})
            downstream_nodes.append({
                "name": node_meta.get(
                    "fullyQualifiedName",
                    node_meta.get("name", did),
                ),
                "type": node_meta.get("type", "unknown"),
            })

        return {
            "downstream_count": len(downstream_nodes),
            "downstream_nodes": downstream_nodes,
        }
