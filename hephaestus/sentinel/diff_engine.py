from dataclasses import dataclass

@dataclass
class SchemaChange:
    added_columns: int
    removed_columns: int
    modified_columns: int
    total_columns_before: int

@dataclass
class VolumeChange:
    changed_rows: int
    total_rows: int

@dataclass
class DiffResult:
    delta: float
    structural_delta: float
    volume_delta: float
    structural_contribution: float
    volume_contribution: float

def compute_change_magnitude(
    schema_change: SchemaChange,
    volume_change: VolumeChange,
    alpha: float,
    beta: float
) -> DiffResult:
    if schema_change.total_columns_before == 0:
        structural_delta = 1.0
    else:
        structural_delta = (schema_change.added_columns + schema_change.removed_columns + schema_change.modified_columns) / schema_change.total_columns_before
    structural_delta = max(0.0, min(structural_delta, 1.0))
    
    if volume_change.total_rows == 0:
        volume_delta = 0.0
    else:
        volume_delta = volume_change.changed_rows / volume_change.total_rows
    volume_delta = max(0.0, min(volume_delta, 1.0))
    
    structural_contribution = alpha * structural_delta
    volume_contribution = beta * volume_delta
    
    delta = structural_contribution + volume_contribution
    delta = max(0.0, min(delta, 1.0))
    
    return DiffResult(
        delta=delta,
        structural_delta=structural_delta,
        volume_delta=volume_delta,
        structural_contribution=structural_contribution,
        volume_contribution=volume_contribution
    )
