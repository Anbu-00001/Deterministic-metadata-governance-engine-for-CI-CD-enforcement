from sentinel.core.blast_radius import calculate_blast_radius, LineageGraph

def test_blast_radius_single_chain():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"C"}, "C": set()})
    assert calculate_blast_radius(graph) == 2

def test_blast_radius_multiple_starts():
    graph = LineageGraph(edges={"A": {"C"}, "B": {"C"}, "C": {"D"}})
    assert calculate_blast_radius(graph) == 2

def test_blast_radius_cycles():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"C"}, "C": {"A"}})
    assert calculate_blast_radius(graph) == 3

def test_blast_radius_empty():
    assert calculate_blast_radius(LineageGraph(edges={})) == 0

def test_blast_radius_no_include_self():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"A"}})
    assert calculate_blast_radius(graph) == 2
