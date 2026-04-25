import json

def get_node_weight(node_name):
    name_lower = node_name.lower()
    if "report" in name_lower:
        return 0.5
    elif "mart" in name_lower:
        return 0.8
    else:
        return 1.0

def calculate_blast_radius(lineage_path, model_name):
    with open(lineage_path, "r") as f:
        graph = json.load(f)
        
    if model_name not in graph:
        return 0.0, {}
        
    visited = {model_name}
    queue = [(model_name, 0)]
    
    r_blast_total = 0.0
    blast_breakdown = {}
    
    while queue:
        current, depth = queue.pop(0)
        
        if depth > 0:
            weight = get_node_weight(current)
            penalty = weight / depth
            r_blast_total += penalty
            blast_breakdown[current] = {"depth": depth, "weight": weight, "penalty": penalty}
            
        for neighbor in graph.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, depth + 1))
                    
    return r_blast_total, blast_breakdown
