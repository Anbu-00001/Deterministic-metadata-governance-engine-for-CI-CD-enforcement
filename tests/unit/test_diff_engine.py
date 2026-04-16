"""Unit tests for the diff engine (change magnitude)."""

from __future__ import annotations

import pytest

from sentinel.core.diff_engine import DiffResult, calculate_change_magnitude


class TestCalculateChangeMagnitude:
    """Tests for ``calculate_change_magnitude``."""

    def test_no_changes(self) -> None:
        """No schema or volume changes → magnitude = 0."""
        result = calculate_change_magnitude(
            schema_diff={"added_columns": [], "removed_columns": [], "modified_columns": []},
            total_columns=10,
            changed_rows=0,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        assert isinstance(result, DiffResult)
        assert result.magnitude == pytest.approx(0.0)
        assert result.structural_delta == pytest.approx(0.0)
        assert result.volume_delta == pytest.approx(0.0)

    def test_structural_only(self) -> None:
        """Only structural changes, no volume change."""
        result = calculate_change_magnitude(
            schema_diff={
                "added_columns": ["new_col"],
                "removed_columns": ["old_col"],
                "modified_columns": [],
            },
            total_columns=10,
            changed_rows=0,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        # ΔS = 2/10 = 0.2, ΔV = 0, Δ = 0.7*0.2 + 0.3*0 = 0.14
        assert result.structural_delta == pytest.approx(0.2)
        assert result.volume_delta == pytest.approx(0.0)
        assert result.magnitude == pytest.approx(0.14)

    def test_volume_only(self) -> None:
        """Only volume changes, no structural change."""
        result = calculate_change_magnitude(
            schema_diff={"added_columns": [], "removed_columns": [], "modified_columns": []},
            total_columns=10,
            changed_rows=500,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        # ΔS = 0, ΔV = 0.5, Δ = 0 + 0.3*0.5 = 0.15
        assert result.volume_delta == pytest.approx(0.5)
        assert result.magnitude == pytest.approx(0.15)

    def test_volume_clamped_to_one(self) -> None:
        """ΔV should be clamped to 1.0 even if changed_rows > total_rows."""
        result = calculate_change_magnitude(
            schema_diff={"added_columns": [], "removed_columns": [], "modified_columns": []},
            total_columns=10,
            changed_rows=2000,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        assert result.volume_delta == pytest.approx(1.0)

    def test_zero_total_columns(self) -> None:
        """Zero total columns → ΔS = 0 (no division by zero)."""
        result = calculate_change_magnitude(
            schema_diff={"added_columns": ["a"], "removed_columns": [], "modified_columns": []},
            total_columns=0,
            changed_rows=0,
            total_rows=100,
            alpha=0.7,
            beta=0.3,
        )
        assert result.structural_delta == pytest.approx(0.0)

    def test_zero_total_rows(self) -> None:
        """Zero total rows → ΔV = 0 (no division by zero)."""
        result = calculate_change_magnitude(
            schema_diff={"added_columns": [], "removed_columns": [], "modified_columns": []},
            total_columns=10,
            changed_rows=100,
            total_rows=0,
            alpha=0.7,
            beta=0.3,
        )
        assert result.volume_delta == pytest.approx(0.0)

    def test_combined_changes(self) -> None:
        """Both structural and volume changes."""
        result = calculate_change_magnitude(
            schema_diff={
                "added_columns": ["a"],
                "removed_columns": ["b"],
                "modified_columns": [{"column": "c"}],
            },
            total_columns=10,
            changed_rows=200,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        # ΔS = 3/10 = 0.3, ΔV = 200/1000 = 0.2
        # Δ = 0.7*0.3 + 0.3*0.2 = 0.21 + 0.06 = 0.27
        assert result.magnitude == pytest.approx(0.27)
