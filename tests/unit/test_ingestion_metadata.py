import pytest
import json
from pathlib import Path
from ingestion.metadata_loader import load_metadata

def test_load_metadata_valid(tmp_path: Path):
    data = {"db.schema.users": [{"name": "id", "description": "User ID", "governance_tags": ["PII"], "tier": 1}]}
    p = tmp_path / "metadata.json"
    p.write_text(json.dumps(data))
    
    res = load_metadata(p)
    assert "db.schema.users" in res
    assert len(res["db.schema.users"]) == 1
    assert res["db.schema.users"][0].name == "id"
    assert res["db.schema.users"][0].tier == 1

def test_load_metadata_missing_fields(tmp_path: Path):
    data = {"db.schema.users": [{"name": "id"}]}
    p = tmp_path / "metadata.json"
    p.write_text(json.dumps(data))
    
    res = load_metadata(p)
    col = res["db.schema.users"][0]
    assert col.name == "id"
    assert col.description == ""
    assert col.governance_tags == []
    assert col.tier == 0

def test_load_metadata_malformed(tmp_path: Path):
    data = {"db.schema.users": "not a list"}
    p = tmp_path / "metadata.json"
    p.write_text(json.dumps(data))
    
    with pytest.raises(ValueError, match="must be a list"):
        load_metadata(p)
