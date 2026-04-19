import pytest
from ai.confidence import compute_confidence

def test_confidence_high():
    c = compute_confidence(100.0, 0, 0.0)
    assert c == 1.0

def test_confidence_moderate():
    c = compute_confidence(80.0, 5, 0.3)
    assert 0.4 <= c <= 0.6

def test_confidence_low():
    c = compute_confidence(30.0, 15, 0.9)
    assert c == 0.01  # Should bottom out at 0.01 floor
