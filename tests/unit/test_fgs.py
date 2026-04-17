from sentinel.core.fgs import calculate_fgs, ColumnMetadata
from config.settings import settings

def test_calculate_fgs_empty():
    res = calculate_fgs(columns=[], blast_radius=0, lambda_decay=0.1, threshold=0.8)
    assert res.score == 0.0
    assert res.is_blocked == True

def test_calculate_fgs_all_unknown():
    cols = [ColumnMetadata(name="test", is_documented=True, criticality_tier=5)] # fallback tier gives weight 0.2
    res = calculate_fgs(columns=cols, blast_radius=0, lambda_decay=0.1, threshold=0.8)
    assert res.compliance_score == 1.0

def test_calculate_fgs_penalty():
    cols = [ColumnMetadata(name="test", is_documented=True, criticality_tier=1)]
    res = calculate_fgs(columns=cols, blast_radius=2, lambda_decay=0.1, threshold=0.8)
    assert res.blast_penalty == 0.1 * 2
    assert res.score == 1.0 - (0.1 * 2)

def test_calculate_fgs_no_description():
    cols = [ColumnMetadata(name="test", is_documented=False, criticality_tier=1)]
    res = calculate_fgs(columns=cols, blast_radius=0, lambda_decay=0.1, threshold=0.8)
    assert res.score == 0.0 # because C_i is 0

def test_calculate_fgs_no_tags():
    cols = [ColumnMetadata(name="test", is_documented=False, criticality_tier=1)]
    res = calculate_fgs(columns=cols, blast_radius=0, lambda_decay=0.1, threshold=0.8)
    assert res.score == 0.0 # because C_i is 0
