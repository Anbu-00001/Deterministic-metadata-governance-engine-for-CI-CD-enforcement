def detect_patterns(history):
    patterns = []
    if not history:
        return patterns
        
    table_violations = {}
    for entry in history:
        if entry.get("decision") == "BLOCK":
            table = entry.get("table", "unknown")
            policies = entry.get("policies_triggered", [])
            for p in policies:
                key = (table, p)
                table_violations[key] = table_violations.get(key, 0) + 1
                
    for (table, policy), count in table_violations.items():
        if count >= 2:
            patterns.append({
                "pattern": f"Repeated '{policy}' violations in {table}",
                "frequency": count,
                "risk_level": "high" if count >= 3 else "medium"
            })
            
    return patterns
