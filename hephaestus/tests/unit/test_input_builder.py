import pytest
from sentinel.fgs import ColumnMetadata
from sentinel.blast_radius import LineageGraph
from sentinel.diff_engine import SchemaChange, VolumeChange
from ingestion.input_builder import build_sentinel_input

def test_build_sentinel_input_valid():
    metadata = {"table_a": [ColumnMetadata("id", "", [], 0)]}
    lineage = LineageGraph(edges={})
    schema = {"table_a": SchemaChange(1, 0, 0, 10)}
    volume = {"table_a": VolumeChange(10, 100)}
    
    res = build_sentinel_input(1, metadata, lineage, schema, volume)
    assert res.pr_number == 1
    assert res.changed_tables == ["table_a"]
    assert res.lineage_graph is lineage

def test_build_sentinel_input_missing_schema():
    metadata = {"table_a": [ColumnMetadata("id", "", [], 0)]}
    lineage = LineageGraph(edges={})
    schema = {}
    volume = {"table_a": VolumeChange(10, 100)}
    
    with pytest.raises(ValueError, match="Missing schema changes"):
        build_sentinel_input(1, metadata, lineage, schema, volume)

def test_build_sentinel_input_empty_metadata():
    metadata = {"table_a": []}
    lineage = LineageGraph(edges={})
    schema = {"table_a": SchemaChange(1, 0, 0, 10)}
    volume = {"table_a": VolumeChange(10, 100)}
    
    with pytest.raises(ValueError, match="Empty metadata is not allowed"):
        build_sentinel_input(1, metadata, lineage, schema, volume)
