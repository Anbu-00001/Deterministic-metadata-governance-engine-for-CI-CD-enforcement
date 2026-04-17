from dataclasses import dataclass
from collections import deque

@dataclass
class LineageGraph:
    edges: dict[str, set[str]]

def compute_blast_radius(
    changed_nodes: list[str],
    lineage_graph: LineageGraph,
    decay_constant: float
) -> int:
    detailed = compute_blast_radius_detailed(changed_nodes, lineage_graph)
    unique_downstream = set()
    for downstream_set in detailed.values():
        unique_downstream.update(downstream_set)
        
    unique_downstream -= set(changed_nodes)
    return len(unique_downstream)

def compute_blast_radius_detailed(
    changed_nodes: list[str],
    lineage_graph: LineageGraph
) -> dict[str, set[str]]:
    result = {}
    for start_node in changed_nodes:
        visited = set()
        queue = deque([start_node])
        
        while queue:
            current = queue.popleft()
            downstream_nodes = lineage_graph.edges.get(current, set())
            for node in downstream_nodes:
                if node not in visited and node != start_node:
                    visited.add(node)
                    queue.append(node)
                    
        result[start_node] = visited

    return result
