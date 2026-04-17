import pytest
import json
from pathlib import Path
from ingestion.lineage_loader import load_lineage

def test_load_lineage_simple(tmp_path: Path):
    data = {"A": ["B", "C"], "B": ["C"]}
    p = tmp_path / "lineage.json"
    p.write_text(json.dumps(data))
    
    graph = load_lineage(p)
    assert set(graph.edges["A"]) == {"B", "C"}
    assert set(graph.edges["B"]) == {"C"}

def test_load_lineage_cycles(tmp_path: Path):
    data = {"A": ["B", "B"], "B": ["A"]}
    p = tmp_path / "lineage.json"
    p.write_text(json.dumps(data))
    
    graph = load_lineage(p)
    assert set(graph.edges["A"]) == {"B"}
    assert set(graph.edges["B"]) == {"A"}

def test_load_lineage_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        load_lineage(tmp_path / "missing.json")
