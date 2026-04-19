import pytest
from intelligence.suggestion_engine import generate_suggestions
from intelligence.impact_simulator import simulate_impact
from intelligence.reasoning_builder import build_reasoning_chain

def test_generate_suggestions():
    metrics = {"fgs_score": 30, "blast_radius": 5}
    policies = ["PII detected but untagged"]
    sugs = generate_suggestions("BLOCK", policies, metrics)
    assert len(sugs) >= 3
    assert any("Metadata" in s["title"] for s in sugs)
    assert any("PII" in s["action"] for s in sugs)

def test_simulate_impact():
    metrics = {"fgs_score": 60, "blast_radius": 2}
    sugs = [{"severity": "high"}]
    sim = simulate_impact(metrics, sugs)
    assert sim["current_fgs"] == 60
    assert sim["projected_fgs"] > 60
    assert sim["delta"] > 0
    assert sim["risk_reduction"] == "High"

def test_build_reasoning_chain():
    metrics = {"fgs_score": 40, "blast_radius": 3}
    policies = ["FGS < 50"]
    chain = build_reasoning_chain(metrics, policies)
    assert len(chain) >= 3
    assert "FGS evaluated at 40" in chain[0]
