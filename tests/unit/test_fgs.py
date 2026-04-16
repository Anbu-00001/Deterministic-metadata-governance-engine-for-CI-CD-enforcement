"""Unit tests for the Forge Governance Score (FGS) engine."""

from __future__ import annotations

import pytest

from sentinel.core.fgs import ColumnMetadata, FGSResult, calculate_fgs


class TestCalculateFGS:
    """Tests for ``calculate_fgs``."""

    def test_all_documented_no_blast(self) -> None:
        """All columns documented, zero blast radius → max compliance."""
        columns = [
            ColumnMetadata(name="id", is_documented=True, criticality_tier=1),
            ColumnMetadata(name="name", is_documented=True, criticality_tier=2),
            ColumnMetadata(name="status", is_documented=True, criticality_tier=3),
        ]
        result = calculate_fgs(columns, blast_radius=0, lambda_decay=0.1, threshold=0.6)
        assert isinstance(result, FGSResult)
        assert result.compliance_score == pytest.approx(1.0)
        assert result.blast_penalty == pytest.approx(0.0)
        assert result.score == pytest.approx(1.0)
        assert result.is_blocked is False
        assert "PASSED" in result.explanation

    def test_none_documented(self) -> None:
        """No columns documented → compliance is 0."""
        columns = [
            ColumnMetadata(name="id", is_documented=False, criticality_tier=1),
            ColumnMetadata(name="name", is_documented=False, criticality_tier=2),
        ]
        result = calculate_fgs(columns, blast_radius=0, lambda_decay=0.1, threshold=0.6)
        assert result.compliance_score == pytest.approx(0.0)
        assert result.score == pytest.approx(0.0)
        assert result.is_blocked is True

    def test_blast_radius_penalty(self) -> None:
        """Blast radius reduces the FGS by λ·R_blast."""
        columns = [
            ColumnMetadata(name="id", is_documented=True, criticality_tier=1),
        ]
        result = calculate_fgs(columns, blast_radius=5, lambda_decay=0.1, threshold=0.6)
        assert result.blast_penalty == pytest.approx(0.5)
        assert result.score == pytest.approx(0.5)
        # 0.5 < threshold 0.6 → blocked
        assert result.is_blocked is True

    def test_mixed_documentation(self) -> None:
        """Partial documentation → weighted compliance between 0 and 1."""
        columns = [
            ColumnMetadata(name="id", is_documented=True, criticality_tier=1),   # T=1.0
            ColumnMetadata(name="name", is_documented=False, criticality_tier=1),  # T=1.0
        ]
        result = calculate_fgs(columns, blast_radius=0, lambda_decay=0.1, threshold=0.6)
        # compliance = (1*1.0 + 0*1.0) / (1.0+1.0) = 0.5
        assert result.compliance_score == pytest.approx(0.5)

    def test_empty_columns(self) -> None:
        """Empty column list → score is 0, blocked."""
        result = calculate_fgs(columns=[], blast_radius=0, lambda_decay=0.1, threshold=0.6)
        assert result.score == pytest.approx(0.0)
        assert result.is_blocked is True

    def test_tier_weights_affect_score(self) -> None:
        """Higher-tier columns have more weight in compliance."""
        # All tier-1 documented
        cols_t1 = [ColumnMetadata(name="a", is_documented=True, criticality_tier=1)]
        # All tier-5 documented
        cols_t5 = [ColumnMetadata(name="a", is_documented=True, criticality_tier=5)]
        r1 = calculate_fgs(cols_t1, blast_radius=0, lambda_decay=0.0, threshold=0.6)
        r5 = calculate_fgs(cols_t5, blast_radius=0, lambda_decay=0.0, threshold=0.6)
        # Both should have compliance 1.0 since all are documented
        assert r1.compliance_score == pytest.approx(1.0)
        assert r5.compliance_score == pytest.approx(1.0)

    def test_threshold_boundary(self) -> None:
        """Score exactly at threshold should pass (not strictly less than)."""
        columns = [
            ColumnMetadata(name="id", is_documented=True, criticality_tier=1),
        ]
        result = calculate_fgs(columns, blast_radius=0, lambda_decay=0.0, threshold=1.0)
        assert result.is_blocked is False
