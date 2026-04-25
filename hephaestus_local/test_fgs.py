import pytest
from sentinel.fgs import calculate_fgs

def test_fgs_high_schema():
    # Mocking would be needed for a strict unit test, but we can rely on our integrated function 
    # to evaluate blast radius exactly as 1.7 based on our JSON outputs.
    schema_path = r"D:\MY PROJECTS\deterministic meta data\hephaestus_local\data\schema.json"
    lineage_path = r"D:\MY PROJECTS\deterministic meta data\hephaestus_local\data\lineage.json"
    
    fgs_raw, fgs_norm, col_contribs, r_blast, blast_breakdown = calculate_fgs(schema_path, lineage_path, "users_model")
    
    assert blast_breakdown["marts_users_enriched"]["weight"] == 0.8
    assert blast_breakdown["marts_users_enriched"]["depth"] == 1
    assert col_contribs["user_id"]["contrib"] == 1.0
