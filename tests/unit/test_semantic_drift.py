"""Unit tests for semantic drift detection.

NOTE: These tests require the sentence-transformers model to be
downloadable.  If running in CI without network, mock the model.
"""

from __future__ import annotations

import pytest

from sentinel.core.semantic_drift import DriftResult, SemanticDriftDetector


@pytest.fixture(scope="module")
def detector() -> SemanticDriftDetector:
    """Create a shared detector instance (model load is expensive)."""
    return SemanticDriftDetector(
        model_name="all-MiniLM-L6-v2",
        threshold=0.85,
    )


class TestSemanticDriftDetector:
    """Tests for ``SemanticDriftDetector.detect``."""

    def test_identical_descriptions(self, detector: SemanticDriftDetector) -> None:
        """Identical texts → similarity ≈ 1.0, no drift."""
        text = "Total revenue from all product sales this quarter."
        result = detector.detect(text, text)
        assert isinstance(result, DriftResult)
        assert result.similarity > 0.99
        assert result.is_drift is False

    def test_similar_descriptions(self, detector: SemanticDriftDetector) -> None:
        """Similar but rephrased → high similarity, likely no drift."""
        dbt = "Total revenue from product sales in the quarter."
        catalog = "Quarterly total revenue generated from all product sales."
        result = detector.detect(dbt, catalog)
        assert result.similarity > 0.80

    def test_different_descriptions(self, detector: SemanticDriftDetector) -> None:
        """Completely different meanings → low similarity, drift flagged."""
        dbt = "Count of active daily users on the platform."
        catalog = "Total weight of shipped packages in kilograms."
        result = detector.detect(dbt, catalog)
        assert result.similarity < 0.5
        assert result.is_drift is True

    def test_empty_dbt_description(self, detector: SemanticDriftDetector) -> None:
        """Empty dbt description → similarity 0, drift flagged."""
        result = detector.detect("", "Some catalog description.")
        assert result.similarity == pytest.approx(0.0)
        assert result.is_drift is True

    def test_empty_catalog_description(self, detector: SemanticDriftDetector) -> None:
        """Empty catalog description → similarity 0, drift flagged."""
        result = detector.detect("Some dbt description.", "")
        assert result.similarity == pytest.approx(0.0)
        assert result.is_drift is True

    def test_both_empty(self, detector: SemanticDriftDetector) -> None:
        """Both empty → similarity 0, drift flagged."""
        result = detector.detect("", "")
        assert result.similarity == pytest.approx(0.0)
        assert result.is_drift is True
