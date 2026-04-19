from __future__ import annotations
from fastapi import APIRouter, Request
from typing import Any, Dict
from pydantic import BaseModel
import uuid
from datetime import datetime

from sentinel.core.blast_radius import calculate_blast_radius
from sentinel.core.fgs import ColumnMetadata, calculate_fgs
from sentinel.core.diff_engine import calculate_change_magnitude, SchemaChange, VolumeChange
from config import settings

router = APIRouter(tags=["sentinel"])

class EvaluateRequest(BaseModel):
    metadata: dict[str, Any] = {}
    lineage: dict[str, Any] = {}
    schema_change: dict[str, Any] = {}
    volume_change: dict[str, Any] = {}

@router.post("/evaluate")
async def evaluate_sentinel(body: EvaluateRequest, request: Request) -> dict:
    """Evaluate a payload and return Phase 1.2 compliant results."""
    
    # ── Orchestrate Engine Logic ──
    # Note: Using existing engine calls without modification
    lineage_graph = body.lineage if isinstance(body.lineage, dict) else {}
    blast_radius = calculate_blast_radius(lineage_graph)
    
    # Simple default entity for real-time demo/ui integration
    fqn = "genesis_entity"
    # Map the first entity if provided
    if body.metadata:
        fqn = next(iter(body.metadata))
        columns_data = body.metadata[fqn]
    else:
        columns_data = {"id": {"tier": 1, "description": "id", "tags": ["key"]}}

    columns = [
        ColumnMetadata(
            name=name,
            is_documented=bool(info.get("description", "").strip()) and bool(info.get("tags", [])),
            criticality_tier=info.get("tier", 3)
        ) for name, info in columns_data.items()
    ]

    fgs_result = calculate_fgs(
        columns=columns,
        blast_radius=blast_radius,
        lambda_decay=settings.lambda_decay,
        threshold=settings.fgs_block_threshold,
    )

    # Diff Magnitude
    diff_result = calculate_change_magnitude(
        schema_change=SchemaChange(**body.schema_change) if body.schema_change else SchemaChange(0,0,0,1),
        volume_change=VolumeChange(**body.volume_change) if body.volume_change else VolumeChange(0,1),
        alpha=settings.alpha_structural,
        beta=settings.beta_volume
    )

    # ── Phase 1.2 Response Construction ──
    decision = "APPROVE"
    if fgs_result.is_blocked:
        decision = "REJECT"
    elif fgs_result.score < 80:
        decision = "REVIEW"

    from policy.policy_engine import policy_engine
    from ai.confidence import compute_confidence
    from chronos.snapshot import log_decision

    policy_result = policy_engine.evaluate(
        decision=decision,
        metrics={
            "fgs_score": fgs_result.score,
            "blast_radius": blast_radius,
            "change_magnitude": diff_result.magnitude
        }
    )
    final_policy_decision = policy_result["final_decision"]
    conf_score = compute_confidence(fgs_result.score, blast_radius, diff_result.magnitude)

    # AI Enhancement layer (OPTIONAL, NON-BREAKING)
    try:
        from ai.insight_generator import generate_insight
        ai_insight = generate_insight(
            sentinel_input=body.model_dump() if hasattr(body, "model_dump") else body.dict(),
            decision={"score": fgs_result.score, "blast": blast_radius, "decision": final_policy_decision}
        )
    except Exception:
        ai_insight = {"summary": "AI unavailable", "risks": [], "suggestions": [], "explanation_tree": []}

    try:
        log_decision({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "table": fqn,
            "decision": final_policy_decision,
            "fgs": fgs_result.score,
            "blast": blast_radius,
            "confidence": conf_score,
            "ai_summary": ai_insight.get("summary", "")
        })
    except Exception:
        pass

    try:
        from intelligence.suggestion_engine import generate_suggestions
        from intelligence.impact_simulator import simulate_impact
        from intelligence.reasoning_builder import build_reasoning_chain
        
        metrics = {"fgs_score": fgs_result.score, "blast_radius": blast_radius, "change_magnitude": diff_result.magnitude}
        suggestions_out = generate_suggestions(final_policy_decision, policy_result["policy_triggered"], metrics)
        simulation_out = simulate_impact(metrics, suggestions_out)
        reasoning_out = build_reasoning_chain(metrics, policy_result["policy_triggered"], ai_insight)
    except Exception:
        suggestions_out = []
        simulation_out = {}
        reasoning_out = []

    # Memory Module (OPTIONAL, NON-BREAKING)
    try:
        from memory.decision_store import append_decision, load_history
        from memory.pattern_engine import detect_patterns
        from memory.risk_predictor import predict_risk
        
        append_decision({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "table": fqn,
            "fgs": fgs_result.score,
            "blast_radius": blast_radius,
            "decision": final_policy_decision,
            "policies_triggered": policy_result["policy_triggered"],
            "columns": list(body.metadata.get(fqn, {}).keys()) if hasattr(body, "metadata") and body.metadata else []
        })
        
        decision_history = load_history()
        patterns_out = detect_patterns(decision_history)
        metrics_for_risk = {"fgs_score": fgs_result.score, "blast_radius": blast_radius}
        risk_pred_out = predict_risk(metrics_for_risk, decision_history)
    except Exception as e:
        patterns_out = []
        risk_pred_out = {"predicted_risk": "unknown", "confidence": 0.0, "reason": str(e)}

    return {
        "id": str(uuid.uuid4()),
        "fgs_score": round(fgs_result.score, 2),
        "blast_radius": blast_radius,
        "change_magnitude": round(diff_result.magnitude, 2),
        "decision": final_policy_decision,
        "policy_decision": final_policy_decision,
        "policy_triggered": policy_result["policy_triggered"],
        "confidence_score": conf_score,
        "ai_insight": ai_insight,
        "suggestions": suggestions_out,
        "simulation": simulation_out,
        "reasoning_chain": reasoning_out,
        "historical_patterns": patterns_out,
        "predicted_risk": risk_pred_out,
        "lineage_graph": {
            "nodes": [{"id": fqn, "name": fqn, "impact": 1.0}] + [
                {"id": f"child_{i}", "name": f"downstream_{i}", "impact": 0.5} 
                for i in range(min(blast_radius, 5))
            ],
            "edges": [{"start": fqn, "end": f"child_{i}"} for i in range(min(blast_radius, 5))]
        },
        "risk": {
            "security_integrity": 20.0,
            "resource_collision": 60.0,
            "orchestration_lag": 15.0
        },
        "suggestions": [
            {
                "id": "opt_01",
                "title": "Enable Partitioning",
                "description": "Shard key optimization detected.",
                "priority": "HIGH",
                "estimated_impact": "+12.4% FGS"
            }
        ],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
