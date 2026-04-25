import json
from sentinel.blast_radius import calculate_blast_radius

def calculate_fgs(schema_path, lineage_path, model_name):
    with open(schema_path, "r") as f:
        schema = json.load(f)
        
    lam = 0.1
    r_blast, blast_breakdown = calculate_blast_radius(lineage_path, model_name)
    
    tier_weights = {1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2}
    
    total_c_t = 0.0
    total_t = 0.0
    col_contributions = {}
    
    for col in schema.get("columns", []):
        name = col.get("name", "unknown")
        tier = col.get("tier", 5)
        has_description = col.get("has_description", False)
        has_tag = col.get("has_tag", False)
        
        c_i = 1.0 if (has_description and has_tag) else 0.0
        t_i = tier_weights.get(tier, 0.2)
        
        contrib = c_i * t_i
        total_c_t += contrib
        total_t += t_i
        
        col_contributions[name] = {"c_i": c_i, "t_i": t_i, "contrib": contrib}
        
    gov_score = (total_c_t / total_t) if total_t > 0 else 0.0
    fgs_raw = gov_score - (lam * r_blast)
    fgs_normalized = max(0.0, min(1.0, fgs_raw))
    
    return fgs_raw, fgs_normalized, col_contributions, r_blast, blast_breakdown
