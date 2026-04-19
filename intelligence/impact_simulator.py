# intelligence/impact_simulator.py

def simulate_impact(metrics, suggestions):
    current_fgs = metrics.get("fgs_score", 0.0)
    projected_fgs = current_fgs
    risk_reduction = "Low"
    
    improvement_factors = 0
    for sug in suggestions:
        if sug["severity"] == "high":
            improvement_factors += 15.0
            risk_reduction = "High"
        elif sug["severity"] == "medium":
            improvement_factors += 8.0
            if risk_reduction != "High":
                risk_reduction = "Medium"
                
    projected_fgs = min(100.0, current_fgs + improvement_factors)
    delta = projected_fgs - current_fgs
    
    return {
        "current_fgs": round(current_fgs, 2),
        "projected_fgs": round(projected_fgs, 2),
        "delta": round(delta, 2),
        "risk_reduction": risk_reduction
    }
