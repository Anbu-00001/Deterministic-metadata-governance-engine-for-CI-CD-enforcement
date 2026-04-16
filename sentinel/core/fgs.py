"""Forge Governance Score (FGS) — deterministic compliance scoring.

Pure computation module.  No I/O, no network calls — only math.

Formula
-------
    FGS = Σ(Cᵢ · Tᵢ) / Σ(Tᵢ)  −  λ · R_blast

Where:
    Cᵢ  = 1 if column *i* is documented **and** tagged, else 0
    Tᵢ  = tier weight for column *i*'s criticality tier
    λ   = decay constant for downstream impact
    R_blast = count of unique downstream dependent nodes
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


# Tier weights: tier 1 (highest criticality) → 1.0, tier 5 (lowest) → 0.2
TIER_WEIGHTS: dict[int, float] = {
    1: 1.0,
    2: 0.8,
    3: 0.6,
    4: 0.4,
    5: 0.2,
}


@dataclass(frozen=True, slots=True)
class ColumnMetadata:
    """Metadata for a single column used in FGS computation.

    Attributes:
        name: Column identifier.
        is_documented: ``True`` if the column has both a description and at
            least one governance tag (``Cᵢ = 1``).
        criticality_tier: Integer 1–5 indicating business criticality
            (1 = highest, 5 = lowest).
    """

    name: str
    is_documented: bool
    criticality_tier: int


@dataclass(frozen=True, slots=True)
class FGSResult:
    """Result of a Forge Governance Score calculation.

    Attributes:
        score: Final FGS value (may be negative if blast penalty dominates).
        compliance_score: Weighted compliance ratio before blast penalty.
        blast_penalty: ``λ · R_blast``.
        blast_radius: Raw downstream node count ``R_blast``.
        is_blocked: Whether the score falls below the configured threshold.
        explanation: Human-readable summary string.
    """

    score: float
    compliance_score: float
    blast_penalty: float
    blast_radius: int
    is_blocked: bool
    explanation: str


def calculate_fgs(
    columns: list[ColumnMetadata],
    blast_radius: int,
    lambda_decay: float,
    threshold: float,
) -> FGSResult:
    """Compute the Forge Governance Score for a set of columns.

    Args:
        columns: Column metadata for every column in the entity.
        blast_radius: ``R_blast`` — unique downstream dependent node count.
        lambda_decay: ``λ`` — decay constant for blast-radius penalty.
        threshold: FGS values below this block the PR.

    Returns:
        A fully-populated :class:`FGSResult`.

    Raises:
        ValueError: If *columns* is empty (cannot compute a score).
    """
    if not columns:
        return FGSResult(
            score=0.0,
            compliance_score=0.0,
            blast_penalty=lambda_decay * blast_radius,
            blast_radius=blast_radius,
            is_blocked=True,
            explanation="FGS: 0.00 (no columns provided). BLOCKED: no columns to score.",
        )

    # Vectorised computation via numpy.
    c_vec = np.array(
        [1.0 if col.is_documented else 0.0 for col in columns], dtype=np.float64
    )
    t_vec = np.array(
        [TIER_WEIGHTS.get(col.criticality_tier, 0.2) for col in columns],
        dtype=np.float64,
    )

    weighted_sum: float = float(np.dot(c_vec, t_vec))       # Σ(Cᵢ · Tᵢ)
    total_weight: float = float(np.sum(t_vec))               # Σ(Tᵢ)

    compliance_score = weighted_sum / total_weight if total_weight > 0.0 else 0.0
    blast_penalty = lambda_decay * blast_radius
    score = compliance_score - blast_penalty
    is_blocked = score < threshold

    verdict = "BLOCKED" if is_blocked else "PASSED"
    explanation = (
        f"FGS: {score:.2f} "
        f"(compliance: {compliance_score:.2f}, "
        f"blast_penalty: {blast_penalty:.2f}, "
        f"R_blast: {blast_radius}). "
        f"{verdict}"
    )
    if is_blocked:
        explanation += f": score below threshold {threshold:.2f}."
    else:
        explanation += "."

    return FGSResult(
        score=round(score, 6),
        compliance_score=round(compliance_score, 6),
        blast_penalty=round(blast_penalty, 6),
        blast_radius=blast_radius,
        is_blocked=is_blocked,
        explanation=explanation,
    )
