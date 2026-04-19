from memory.decision_store import append_decision, load_history
import os

def test_memory_decision_store(tmp_path, monkeypatch):
    import memory.decision_store as ds
    test_log = tmp_path / "decision_log.json"
    monkeypatch.setattr(ds, "LOG_FILE", str(test_log))
    
    rec1 = {"timestamp": "1", "table": "A", "fgs": 80, "blast_radius": 2, "decision": "ALLOW", "policies_triggered": [], "columns": ["id"]}
    rec2 = {"timestamp": "2", "table": "B", "fgs": 30, "blast_radius": 1, "decision": "BLOCK", "policies_triggered": ["FGS_LOW"], "columns": ["id", "pii"]}
    
    ds.append_decision(rec1)
    ds.append_decision(rec2)
    history = ds.load_history()
    assert len(history) == 2
    assert history[0]["table"] == "A"
    
def test_pattern_engine():
    from memory.pattern_engine import detect_patterns
    history = [
        {"table": "users", "decision": "BLOCK", "policies_triggered": ["PII_PROTECTION"]},
        {"table": "users", "decision": "BLOCK", "policies_triggered": ["PII_PROTECTION"]}
    ]
    patterns = detect_patterns(history)
    assert len(patterns) > 0
    assert "Repeated" in patterns[0]["pattern"]
    assert patterns[0]["frequency"] == 2

def test_risk_predictor():
    from memory.risk_predictor import predict_risk
    history = [{"decision": "BLOCK"}] * 6
    metrics = {"table": "test"}
    prediction = predict_risk(metrics, history)
    assert prediction["predicted_risk"] == "high"
    assert prediction["confidence"] > 0.8
