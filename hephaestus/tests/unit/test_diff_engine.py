from sentinel.diff_engine import compute_change_magnitude, SchemaChange, VolumeChange

def test_compute_change_magnitude_basic():
    sc = SchemaChange(added_columns=1, removed_columns=0, modified_columns=0, total_columns_before=10)
    vc = VolumeChange(changed_rows=10, total_rows=100)
    
    res = compute_change_magnitude(sc, vc, alpha=0.7, beta=0.3)
    
    # 1/10 = 0.1
    assert round(res.structural_delta, 2) == 0.1
    # 10/100 = 0.1
    assert round(res.volume_delta, 2) == 0.1
    # 0.7*0.1 + 0.3*0.1 = 0.1
    assert round(res.delta, 2) == 0.1

def test_compute_change_magnitude_no_data():
    sc = SchemaChange(added_columns=0, removed_columns=0, modified_columns=0, total_columns_before=0)
    vc = VolumeChange(changed_rows=0, total_rows=0)
    
    res = compute_change_magnitude(sc, vc, alpha=0.7, beta=0.3)
    
    assert res.structural_delta == 1.0 # fallback when total=0
    assert res.volume_delta == 0.0 # fallback when total=0
    
    assert round(res.delta, 2) == 0.7 # 1.0*0.7 + 0.0*0.3
    
def test_compute_change_magnitude_clamped():
    sc = SchemaChange(added_columns=20, removed_columns=0, modified_columns=0, total_columns_before=10)
    vc = VolumeChange(changed_rows=200, total_rows=100)
    
    res = compute_change_magnitude(sc, vc, alpha=0.7, beta=0.3)
    
    assert res.structural_delta == 1.0
    assert res.volume_delta == 1.0
    assert res.delta == 1.0
