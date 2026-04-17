from sentinel.fgs import ColumnMetadata
from sentinel.blast_radius import LineageGraph
from sentinel.diff_engine import SchemaChange, VolumeChange
from sentinel.sentinel import SentinelInput

def build_sentinel_input(
    pr_number: int,
    metadata: dict[str, list[ColumnMetadata]],
    lineage: LineageGraph,
    schema_changes: dict[str, SchemaChange],
    volume_changes: dict[str, VolumeChange]
) -> SentinelInput:
    changed_tables = list(metadata.keys())
    
    for table_fqn in changed_tables:
        if not metadata[table_fqn]:
            raise ValueError(f"Empty metadata is not allowed for changed table {table_fqn}")
            
        if table_fqn not in schema_changes:
            raise ValueError(f"Missing schema changes for changed table {table_fqn}")
            
        if table_fqn not in volume_changes:
            raise ValueError(f"Missing volume changes for changed table {table_fqn}")
            
    if not isinstance(lineage, LineageGraph):
        raise ValueError("Lineage must be a LineageGraph instance")
        
    return SentinelInput(
        pr_number=pr_number,
        changed_tables=changed_tables,
        column_metadata=metadata,
        lineage_graph=lineage,
        schema_changes=schema_changes,
        volume_changes=volume_changes
    )
