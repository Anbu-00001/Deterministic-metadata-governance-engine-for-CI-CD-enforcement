"""Forge drill: PII detection scenario.

Validates that the PII detection skill correctly identifies sensitive
column patterns and assigns appropriate risk levels.
"""

from __future__ import annotations

import pytest

from sentinel.skills.pii_detection.skill import PIIDetectionSkill


class TestPIIDetectionDrill:
    """End-to-end drill for PII detection."""

    @pytest.mark.asyncio
    async def test_detects_email_and_ssn(self) -> None:
        """Columns with email and SSN patterns → HIGH risk."""
        skill = PIIDetectionSkill()
        context = {
            "column_names": [
                "order_id",
                "customer_email",
                "ssn",
                "amount",
                "created_at",
            ]
        }
        assert await skill.is_applicable(context) is True
        result = await skill.execute(context)
        assert "customer_email" in result["pii_columns"]
        assert "ssn" in result["pii_columns"]
        assert result["risk_level"] == "HIGH"

    @pytest.mark.asyncio
    async def test_no_pii_columns(self) -> None:
        """No PII patterns → skill is not applicable."""
        skill = PIIDetectionSkill()
        context = {
            "column_names": ["order_id", "amount", "status", "created_at"]
        }
        assert await skill.is_applicable(context) is False

    @pytest.mark.asyncio
    async def test_single_non_critical_pii(self) -> None:
        """One non-critical PII column → MEDIUM risk."""
        skill = PIIDetectionSkill()
        context = {"column_names": ["id", "first_name", "amount"]}
        result = await skill.execute(context)
        assert "first_name" in result["pii_columns"]
        assert result["risk_level"] == "MEDIUM"
