import json
from pathlib import Path
from sentinel.blast_radius import LineageGraph

def load_lineage(path: Path) -> LineageGraph:
    if not path.exists():
        raise FileNotFoundError(f"Lineage file not found: {path}")
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not isinstance(data, dict):
        raise ValueError("Lineage root must be a dict mapping node to list of downstream nodes")
        
    edges = {}
    for node, downstream in data.items():
        if not isinstance(downstream, list):
            raise ValueError(f"Downstream nodes for {node} must be a list")
        edges[str(node)] = set(str(d) for d in downstream)
        
    return LineageGraph(edges=edges)
