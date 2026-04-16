"""Change-magnitude engine for schema and volume deltas.

Pure computation module — no I/O.

Formula
-------
    Δ = α · ΔS + β · ΔV

Where:
    ΔS = (added + removed + modified) / total_columns   (structural delta)
    ΔV = changed_rows / total_rows, clamped to [0.0, 1.0] (volume delta)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class DiffResult:
    """Result of a change-magnitude computation.

    Attributes:
        magnitude: Combined change score ``Δ = α·ΔS + β·ΔV``.
        structural_delta: Proportion of columns affected (``ΔS``).
        volume_delta: Normalised row-change ratio (``ΔV``), clamped 0–1.
        summary: Human-readable explanation.
    """

    magnitude: float
    structural_delta: float
    volume_delta: float
    summary: str


def calculate_change_magnitude(
    schema_diff: dict[str, Any],
    total_columns: int,
    changed_rows: int,
    total_rows: int,
    alpha: float,
    beta: float,
) -> DiffResult:
    """Compute combined structural + volume change magnitude.

    Args:
        schema_diff: Output of :func:`mcp.tools.diff_tools.compare_schemas`
            containing ``added_columns``, ``removed_columns``, and
            ``modified_columns`` lists.
        total_columns: Total column count of the entity (denominator for ΔS).
        changed_rows: Number of rows that changed between snapshots.
        total_rows: Total row count of the entity (denominator for ΔV).
        alpha: Weight ``α`` for the structural delta term.
        beta: Weight ``β`` for the volume delta term.

    Returns:
        A :class:`DiffResult` with the computed magnitude and components.
    """
    added_count = len(schema_diff.get("added_columns", []))
    removed_count = len(schema_diff.get("removed_columns", []))
    modified_count = len(schema_diff.get("modified_columns", []))
    affected = added_count + removed_count + modified_count

    # ΔS: structural delta
    if total_columns > 0:
        structural_delta = affected / total_columns
    else:
        structural_delta = 0.0

    # ΔV: volume delta, clamped to [0.0, 1.0]
    if total_rows > 0:
        volume_delta = min(max(changed_rows / total_rows, 0.0), 1.0)
    else:
        volume_delta = 0.0

    # Δ = α · ΔS + β · ΔV
    magnitude = alpha * structural_delta + beta * volume_delta

    summary = (
        f"Δ={magnitude:.4f} "
        f"(ΔS={structural_delta:.4f} [{added_count} added, "
        f"{removed_count} removed, {modified_count} modified "
        f"/ {total_columns} total cols], "
        f"ΔV={volume_delta:.4f} [{changed_rows}/{total_rows} rows])"
    )

    return DiffResult(
        magnitude=round(magnitude, 6),
        structural_delta=round(structural_delta, 6),
        volume_delta=round(volume_delta, 6),
        summary=summary,
    )
