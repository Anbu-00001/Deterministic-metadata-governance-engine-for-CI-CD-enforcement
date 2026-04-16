"""Unit tests for blast-radius calculation."""

from __future__ import annotations

from sentinel.core.blast_radius import calculate_blast_radius


class TestCalculateBlastRadius:
    """Tests for ``calculate_blast_radius``."""

    def test_empty_graph(self) -> None:
        """No downstream edges → R_blast = 0."""
        assert calculate_blast_radius({}) == 0

    def test_no_downstream_edges(self) -> None:
        """Graph with entity but no downstream edges → 0."""
        graph = {
            "entity": {"id": "root"},
            "nodes": [{"id": "root", "name": "root_table"}],
            "downstreamEdges": [],
        }
        assert calculate_blast_radius(graph) == 0

    def test_single_downstream(self) -> None:
        """One direct downstream node → R_blast = 1."""
        graph = {
            "entity": {"id": "root"},
            "nodes": [
                {"id": "root", "name": "root_table"},
                {"id": "d1", "name": "downstream_1"},
            ],
            "downstreamEdges": [
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "d1"}},
            ],
        }
        assert calculate_blast_radius(graph) == 1

    def test_chain_downstream(self) -> None:
        """Chain: root → d1 → d2 → d3 → R_blast = 3."""
        graph = {
            "entity": {"id": "root"},
            "nodes": [
                {"id": "root"}, {"id": "d1"}, {"id": "d2"}, {"id": "d3"},
            ],
            "downstreamEdges": [
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "d1"}},
                {"fromEntity": {"id": "d1"}, "toEntity": {"id": "d2"}},
                {"fromEntity": {"id": "d2"}, "toEntity": {"id": "d3"}},
            ],
        }
        assert calculate_blast_radius(graph) == 3

    def test_fan_out(self) -> None:
        """Root fans out to 3 nodes → R_blast = 3."""
        graph = {
            "entity": {"id": "root"},
            "nodes": [
                {"id": "root"}, {"id": "a"}, {"id": "b"}, {"id": "c"},
            ],
            "downstreamEdges": [
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "a"}},
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "b"}},
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "c"}},
            ],
        }
        assert calculate_blast_radius(graph) == 3

    def test_diamond_deduplication(self) -> None:
        """Diamond pattern: root → A, root → B, A → C, B → C → R_blast = 3."""
        graph = {
            "entity": {"id": "root"},
            "nodes": [
                {"id": "root"}, {"id": "A"}, {"id": "B"}, {"id": "C"},
            ],
            "downstreamEdges": [
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "A"}},
                {"fromEntity": {"id": "root"}, "toEntity": {"id": "B"}},
                {"fromEntity": {"id": "A"}, "toEntity": {"id": "C"}},
                {"fromEntity": {"id": "B"}, "toEntity": {"id": "C"}},
            ],
        }
        assert calculate_blast_radius(graph) == 3

    def test_string_entity_refs(self) -> None:
        """Entity refs as bare strings (not dicts)."""
        graph = {
            "entity": "root",
            "nodes": [],
            "downstreamEdges": [
                {"fromEntity": "root", "toEntity": "d1"},
                {"fromEntity": "root", "toEntity": "d2"},
            ],
        }
        assert calculate_blast_radius(graph) == 2
