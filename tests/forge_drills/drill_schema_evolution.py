"""Forge drill: schema evolution scenario.

Simulates a table gaining new columns across a version bump and
validates that the FGS and change-magnitude formulas react correctly.
"""

from __future__ import annotations

import pytest

from sentinel.core.diff_engine import calculate_change_magnitude
from sentinel.core.fgs import ColumnMetadata, calculate_fgs


class TestSchemaEvolutionDrill:
    """End-to-end drill testing schema evolution impact."""

    def test_adding_undocumented_columns_drops_fgs(self) -> None:
        """Adding new undocumented columns should lower compliance."""
        # Before: 3 documented columns
        before = [
            ColumnMetadata(name="id", is_documented=True, criticality_tier=1),
            ColumnMetadata(name="name", is_documented=True, criticality_tier=2),
            ColumnMetadata(name="status", is_documented=True, criticality_tier=3),
        ]
        fgs_before = calculate_fgs(before, blast_radius=0, lambda_decay=0.1, threshold=0.6)

        # After: same 3 documented + 2 new undocumented
        after = before + [
            ColumnMetadata(name="new_col_1", is_documented=False, criticality_tier=3),
            ColumnMetadata(name="new_col_2", is_documented=False, criticality_tier=4),
        ]
        fgs_after = calculate_fgs(after, blast_radius=0, lambda_decay=0.1, threshold=0.6)

        assert fgs_after.compliance_score < fgs_before.compliance_score

    def test_change_magnitude_reflects_additions(self) -> None:
        """Adding 2 columns to a 5-column table → ΔS = 2/5 = 0.4."""
        diff = calculate_change_magnitude(
            schema_diff={
                "added_columns": ["new_col_1", "new_col_2"],
                "removed_columns": [],
                "modified_columns": [],
            },
            total_columns=5,
            changed_rows=0,
            total_rows=1000,
            alpha=0.7,
            beta=0.3,
        )
        assert diff.structural_delta == pytest.approx(0.4)
        # Δ = 0.7 * 0.4 + 0.3 * 0 = 0.28
        assert diff.magnitude == pytest.approx(0.28)
