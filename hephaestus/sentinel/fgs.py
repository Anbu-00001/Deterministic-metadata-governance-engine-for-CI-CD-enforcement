from dataclasses import dataclass
from config.settings import settings

TIER_WEIGHTS = {
    1: 1.0,
    2: 0.8,
    3: 0.6,
    4: 0.4,
    5: 0.2
}

@dataclass
class ColumnMetadata:
    name: str
    description: str
    governance_tags: list[str]
    tier: int

@dataclass
class FGSInput:
    columns: list[ColumnMetadata]
    blast_radius: int

@dataclass
class FGSResult:
    score: float
    weighted_compliance: float
    blast_penalty: float
    column_count: int
    compliant_columns: int
    is_blocked: bool

def compute_fgs(fgs_input: FGSInput) -> FGSResult:
    if not fgs_input.columns:
        return FGSResult(
            score=0.0,
            weighted_compliance=0.0,
            blast_penalty=0.0,
            column_count=0,
            compliant_columns=0,
            is_blocked=True
        )
        
    total_ti = 0.0
    weighted_sum = 0.0
    compliant_columns = 0
    
    for col in fgs_input.columns:
        ti = TIER_WEIGHTS.get(col.tier, 0.6)
        total_ti += ti
        
        ci = 1 if col.description and col.description.strip() and len(col.governance_tags) > 0 else 0
        if ci == 1:
            compliant_columns += 1
            
        weighted_sum += ci * ti
        
    if total_ti == 0.0:
        return FGSResult(
            score=0.0,
            weighted_compliance=0.0,
            blast_penalty=0.0,
            column_count=len(fgs_input.columns),
            compliant_columns=compliant_columns,
            is_blocked=True
        )
        
    weighted_compliance = weighted_sum / total_ti
    blast_penalty = settings.LAMBDA_DECAY * fgs_input.blast_radius
    score = weighted_compliance - blast_penalty
    
    score = min(score, 1.0)
    is_blocked = score < settings.FGS_BLOCK_THRESHOLD
    
    return FGSResult(
        score=score,
        weighted_compliance=weighted_compliance,
        blast_penalty=blast_penalty,
        column_count=len(fgs_input.columns),
        compliant_columns=compliant_columns,
        is_blocked=is_blocked
    )
