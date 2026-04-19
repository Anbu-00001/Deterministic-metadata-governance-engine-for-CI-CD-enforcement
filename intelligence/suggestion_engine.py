# intelligence/suggestion_engine.py

def generate_suggestions(decision, triggered_policies, metrics):
    suggestions = []
    
    # Example logic mapping to issues
    if metrics.get("fgs_score", 100) < 50:
        suggestions.append({
            "title": "Improve Metadata Completeness",
            "severity": "high",
            "action": "Add missing descriptions and tags to your schema columns.",
            "expected_impact": "Boosts FGS score substantially."
        })
        
    if metrics.get("blast_radius", 0) > 3:
        suggestions.append({
            "title": "Mitigate Downstream Impact",
            "severity": "medium",
            "action": "Consider versioning the table or using a staging view for this change.",
            "expected_impact": "Reduces blast radius risk to downstream consumers."
        })
        
    for policy in triggered_policies:
        if "PII" in policy.upper() or "SENSITIVE" in policy.upper():
            suggestions.append({
                "title": "Tag Sensitive Data",
                "severity": "high",
                "action": "Add appropriate classification tags (e.g., 'PII', 'sensitive') to the column metadata.",
                "expected_impact": "Resolves PII protection policy violations."
            })
            
    if not suggestions:
        suggestions.append({
            "title": "Continuous Maintenance",
            "severity": "low",
            "action": "Ensure all future columns continue to follow documentation standards.",
            "expected_impact": "Maintains current healthy FGS."
        })
        
    return suggestions
