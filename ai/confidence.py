# ai/confidence.py
def compute_confidence(fgs: float, blast: int, diff: float) -> float:
    # High FGS means high confidence in safety
    # Low diff means high confidence
    # Blast radius normalizes confidence (more blast = less certainty)
    
    score = 1.0 - (min(blast, 10) * 0.05) - min(float(diff), 0.5)
    return round(max(0.01, min(score, 1.0)), 2)
