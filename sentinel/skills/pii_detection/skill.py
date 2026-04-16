"""PII detection governance skill.

Scans column names for patterns that indicate Personally Identifiable
Information and assigns a risk level.
"""

from __future__ import annotations

import re
from typing import Any

from sentinel.skills.base_skill import BaseSkill

# Default PII patterns — can be overridden via context["pii_patterns"].
DEFAULT_PII_PATTERNS: list[str] = [
    r"(?i)(e[-_]?mail)",
    r"(?i)(ssn|social[-_]?security)",
    r"(?i)(phone|mobile|cell)[-_]?(number|num|no)?",
    r"(?i)(d[_-]?o[_-]?b|date[-_]?of[-_]?birth|birth[-_]?date)",
    r"(?i)(address|street|zip[-_]?code|postal)",
    r"(?i)(credit[-_]?card|card[-_]?number|ccn|pan)",
    r"(?i)(passport)[-_]?(number|num|no)?",
    r"(?i)(driver[-_]?license|dl[-_]?number)",
    r"(?i)(national[-_]?id|nin)",
    r"(?i)(first[-_]?name|last[-_]?name|full[-_]?name|surname)",
]

# Patterns that always trigger HIGH risk.
HIGH_RISK_PATTERNS: set[str] = {
    r"(?i)(ssn|social[-_]?security)",
    r"(?i)(credit[-_]?card|card[-_]?number|ccn|pan)",
    r"(?i)(passport)[-_]?(number|num|no)?",
}


class PIIDetectionSkill(BaseSkill):
    """Detect columns with PII-like names and assess risk level.

    Attributes:
        name: ``"pii_detection"``
        description: Short description of the skill's purpose.
    """

    name: str = "pii_detection"
    description: str = "Scans column names for PII patterns and assigns risk levels."

    async def is_applicable(self, context: dict[str, Any]) -> bool:
        """Return ``True`` if any column name matches a PII pattern.

        Args:
            context: Must contain ``"column_names"`` (list of str).

        Returns:
            ``True`` when at least one column name matches.
        """
        column_names: list[str] = context.get("column_names", [])
        patterns = context.get("pii_patterns", DEFAULT_PII_PATTERNS)
        compiled = [re.compile(p) for p in patterns]
        return any(
            pat.search(col) for col in column_names for pat in compiled
        )

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Run PII detection over column names.

        Args:
            context: Must contain ``"column_names"`` (list of str).
                Optionally ``"pii_patterns"`` to override the defaults.

        Returns:
            ``{"pii_columns": [...], "risk_level": "HIGH"|"MEDIUM"|"LOW"}``
        """
        column_names: list[str] = context.get("column_names", [])
        patterns = context.get("pii_patterns", DEFAULT_PII_PATTERNS)
        compiled = [(p, re.compile(p)) for p in patterns]

        pii_columns: list[str] = []
        has_high_risk = False

        for col in column_names:
            for raw_pattern, regex in compiled:
                if regex.search(col):
                    pii_columns.append(col)
                    if raw_pattern in HIGH_RISK_PATTERNS:
                        has_high_risk = True
                    break  # One match per column is enough.

        # Determine risk level.
        if has_high_risk or len(pii_columns) >= 3:
            risk_level = "HIGH"
        elif pii_columns:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "pii_columns": sorted(set(pii_columns)),
            "risk_level": risk_level,
        }
