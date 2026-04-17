from sentinel.blast_radius import compute_blast_radius, LineageGraph

def test_blast_radius_single_chain():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"C"}, "C": set()})
    assert compute_blast_radius(["A"], graph, 0.1) == 2

def test_blast_radius_multiple_starts():
    graph = LineageGraph(edges={"A": {"C"}, "B": {"C"}, "C": {"D"}})
    assert compute_blast_radius(["A", "B"], graph, 0.1) == 2

def test_blast_radius_cycles():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"C"}, "C": {"A"}})
    assert compute_blast_radius(["A"], graph, 0.1) == 2

def test_blast_radius_empty():
    graph = LineageGraph(edges={"A": {"B"}})
    assert compute_blast_radius(["X"], graph, 0.1) == 0

def test_blast_radius_no_include_self():
    graph = LineageGraph(edges={"A": {"B"}, "B": {"A"}})
    assert compute_blast_radius(["A"], graph, 0.1) == 1
