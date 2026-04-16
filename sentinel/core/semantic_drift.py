"""Semantic drift detection between dbt descriptions and OpenMetadata catalog.

Uses sentence-transformer embeddings and numpy cosine similarity to
quantify how far a code-side description has drifted from its catalog
counterpart.

Formula
-------
    SA = (u · v) / (‖u‖ · ‖v‖)

Where *u* = embedding(dbt_description) and *v* = embedding(catalog_description).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sentence_transformers import SentenceTransformer


@dataclass(frozen=True, slots=True)
class DriftResult:
    """Outcome of a semantic-drift comparison.

    Attributes:
        similarity: Cosine similarity in ``[−1, 1]`` (typically ``[0, 1]``
            for natural-language text).
        is_drift: ``True`` when similarity falls below the threshold.
        threshold: The configured drift threshold that was applied.
        dbt_description: The description from the dbt YAML.
        catalog_description: The description from OpenMetadata catalog.
    """

    similarity: float
    is_drift: bool
    threshold: float
    dbt_description: str
    catalog_description: str


class SemanticDriftDetector:
    """Detects semantic drift between dbt model descriptions and OpenMetadata.

    The detector is **stateful** — it loads a sentence-transformer model
    once on construction and reuses it for every :meth:`detect` call.

    Args:
        model_name: HuggingFace model identifier for the sentence-transformer.
        threshold: Cosine-similarity values below this are flagged as drift.
    """

    def __init__(self, model_name: str, threshold: float) -> None:
        self.model: SentenceTransformer = SentenceTransformer(model_name)
        self.threshold: float = threshold

    def detect(
        self,
        dbt_description: str,
        catalog_description: str,
    ) -> DriftResult:
        """Compare two descriptions and determine if semantic drift occurred.

        Args:
            dbt_description: The description from the dbt schema YAML.
            catalog_description: The description stored in the OpenMetadata
                catalog.

        Returns:
            A :class:`DriftResult` with the computed similarity and drift flag.
        """
        # Handle degenerate inputs.
        if not dbt_description.strip() or not catalog_description.strip():
            return DriftResult(
                similarity=0.0,
                is_drift=True,
                threshold=self.threshold,
                dbt_description=dbt_description,
                catalog_description=catalog_description,
            )

        # Encode both descriptions into dense vectors.
        embeddings = self.model.encode(
            [dbt_description, catalog_description],
            convert_to_numpy=True,
            normalize_embeddings=False,
        )
        u: np.ndarray = embeddings[0].astype(np.float64)
        v: np.ndarray = embeddings[1].astype(np.float64)

        # SA = (u · v) / (‖u‖ · ‖v‖)
        dot_product: float = float(np.dot(u, v))
        norm_u: float = float(np.linalg.norm(u))
        norm_v: float = float(np.linalg.norm(v))

        if norm_u == 0.0 or norm_v == 0.0:
            similarity = 0.0
        else:
            similarity = dot_product / (norm_u * norm_v)

        return DriftResult(
            similarity=round(similarity, 6),
            is_drift=similarity < self.threshold,
            threshold=self.threshold,
            dbt_description=dbt_description,
            catalog_description=catalog_description,
        )
