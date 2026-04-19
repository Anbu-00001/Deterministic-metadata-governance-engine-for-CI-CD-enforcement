import pytest
from policy.policy_engine import policy_engine

def test_policy_high_blast():
    metrics = {"fgs_score": 90, "blast_radius": 6}
    res = policy_engine.evaluate("ALLOW", metrics)
    assert res["final_decision"] == "BLOCK"
    assert "blast_radius > 5" in res["policy_triggered"][0]

def test_policy_low_fgs():
    metrics = {"fgs_score": 30, "blast_radius": 0}
    res = policy_engine.evaluate("ALLOW", metrics)
    assert res["final_decision"] == "BLOCK"
    assert "FGS < 40" in res["policy_triggered"][0]

def test_policy_moderate_risk():
    metrics = {"fgs_score": 75, "blast_radius": 2}
    res = policy_engine.evaluate("ALLOW", metrics)
    assert res["final_decision"] == "WARN"
    assert "Moderate Risk" in res["policy_triggered"][0]

def test_policy_safe():
    metrics = {"fgs_score": 95, "blast_radius": 0}
    res = policy_engine.evaluate("ALLOW", metrics)
    assert res["final_decision"] == "ALLOW"
    assert len(res["policy_triggered"]) == 0
