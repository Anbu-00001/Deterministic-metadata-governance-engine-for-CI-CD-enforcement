"""
Deterministic Governance Rule Definitions for Hephaestus
"""

def evaluate_metrics(decision: str, metrics: dict) -> dict:
    fgs = metrics.get("fgs_score", 100)
    blast = metrics.get("blast_radius", 0)
    
    triggers = []
    final_decision = decision
    
    if blast > 5:
        triggers.append("blast_radius > 5 (High Downstream Impact)")
        final_decision = "BLOCK"
    if fgs < 40:
        triggers.append("FGS < 40 (Critical Compliance Failure)")
        final_decision = "BLOCK"
    elif fgs < 80 and blast > 0 and final_decision != "BLOCK":
        triggers.append("Moderate Risk (FGS < 80 + Active Downstream)")
        final_decision = "WARN"

    return {
        "final_decision": final_decision,
        "policy_triggered": triggers
    }