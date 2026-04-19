def predict_risk(metrics, history):
    if not history:
        return {
            "predicted_risk": "low",
            "confidence": 0.0,
            "reason": "No historical context available."
        }
    
    # Simple statistical inference
    block_records = [h for h in history if h.get("decision") == "BLOCK"]
    recent_blocks = len(block_records[-10:]) if len(block_records) else 0
    total_blocks = len(block_records)
    
    if recent_blocks > 2 or total_blocks > 5:
        return {
            "predicted_risk": "high",
            "confidence": 0.85,
            "reason": "System detects recurring elevated risk patterns in recent evaluations."
        }
    elif total_blocks > 0:
        return {
            "predicted_risk": "medium",
            "confidence": 0.6,
            "reason": "Historical precedent shows moderate blocking probability."
        }
    
    return {
        "predicted_risk": "low",
        "confidence": 0.4,
        "reason": "Strong history of allowable changes with current profile."
    }
