from sentinel.fgs import compute_fgs, FGSInput, ColumnMetadata
from config.settings import settings

def test_compute_fgs_empty():
    fgs_in = FGSInput(columns=[], blast_radius=0)
    res = compute_fgs(fgs_in)
    assert res.score == 0.0
    assert res.is_blocked == True

def test_compute_fgs_all_unknown():
    cols = [ColumnMetadata(name="test", description="desc", governance_tags=["PII"], tier=0)]
    fgs_in = FGSInput(columns=cols, blast_radius=0)
    res = compute_fgs(fgs_in)
    assert res.weighted_compliance == 1.0

def test_compute_fgs_penalty():
    cols = [ColumnMetadata(name="test", description="desc", governance_tags=["PII"], tier=1)]
    fgs_in = FGSInput(columns=cols, blast_radius=2)
    res = compute_fgs(fgs_in)
    assert res.blast_penalty == settings.LAMBDA_DECAY * 2
    assert res.score == 1.0 - (settings.LAMBDA_DECAY * 2)

def test_compute_fgs_no_description():
    cols = [ColumnMetadata(name="test", description="", governance_tags=["tag"], tier=1)]
    fgs_in = FGSInput(columns=cols, blast_radius=0)
    res = compute_fgs(fgs_in)
    assert res.score == 0.0 # because C_i is 0

def test_compute_fgs_no_tags():
    cols = [ColumnMetadata(name="test", description="desc", governance_tags=[], tier=1)]
    fgs_in = FGSInput(columns=cols, blast_radius=0)
    res = compute_fgs(fgs_in)
    assert res.score == 0.0 # because C_i is 0
