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

@dataclass
class SchemaChange:
    added_columns: int
    removed_columns: int
    modified_columns: int
    total_columns_before: int

@dataclass
class VolumeChange:
    changed_rows: int
    total_rows: int

@dataclass(frozen=True, slots=True)
class DiffResult:
    """Result of a change-magnitude computation."""
    magnitude: float
    structural_delta: float
    volume_delta: float
    structural_contribution: float
    volume_contribution: float
    summary: str


def calculate_change_magnitude(
    schema_change: SchemaChange,
    volume_change: VolumeChange,
    alpha: float,
    beta: float,
) -> DiffResult:
    """Compute combined structural + volume change magnitude.

    Args:
        schema_change: Explicit struct for schema modifications.
        volume_change: Explicit struct for volume modifications.
        alpha: Weight ``α`` for the structural delta term.
        beta: Weight ``β`` for the volume delta term.

    Returns:
        A :class:`DiffResult` with the computed magnitude and components.
    """
    total_columns = schema_change.total_columns_before
    added_count = schema_change.added_columns
    removed_count = schema_change.removed_columns
    modified_count = schema_change.modified_columns

    if total_columns > 0:
        structural_delta = (added_count + removed_count + modified_count) / total_columns
    else:
        structural_delta = 1.0
    structural_delta = max(0.0, min(structural_delta, 1.0))

    if volume_change.total_rows > 0:
        volume_delta = volume_change.changed_rows / volume_change.total_rows
    else:
        volume_delta = 0.0
    volume_delta = max(0.0, min(volume_delta, 1.0))

    structural_contribution = alpha * structural_delta
    volume_contribution = beta * volume_delta

    magnitude = structural_contribution + volume_contribution
    magnitude = max(0.0, min(magnitude, 1.0))

    summary = (
        f"Δ={magnitude:.4f} "
        f"(ΔS={structural_delta:.4f} [{added_count} added, "
        f"{removed_count} removed, {modified_count} modified "
        f"/ {total_columns} total cols], "
        f"ΔV={volume_delta:.4f} [{volume_change.changed_rows}/{volume_change.total_rows} rows])"
    )

    return DiffResult(
        magnitude=round(magnitude, 6),
        structural_delta=round(structural_delta, 6),
        volume_delta=round(volume_delta, 6),
        structural_contribution=round(structural_contribution, 6),
        volume_contribution=round(volume_contribution, 6),
        summary=summary,
    )
