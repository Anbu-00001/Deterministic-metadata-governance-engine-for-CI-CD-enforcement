import json
from pathlib import Path
from sentinel.core.diff_engine import SchemaChange

def load_schema_changes(path: Path) -> dict[str, SchemaChange]:
    if not path.exists():
        raise FileNotFoundError(f"Schema file not found: {path}")
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not isinstance(data, dict):
        raise ValueError("Schema root must be a dict mapping table_fqn to changes")
        
    result = {}
    for table_fqn, change in data.items():
        if not isinstance(change, dict):
            raise ValueError(f"Schema change for {table_fqn} must be a dict")
            
        try:
            added = int(change.get("added_columns", 0))
            removed = int(change.get("removed_columns", 0))
            modified = int(change.get("modified_columns", 0))
            total = int(change.get("total_columns_before", 0))
        except (ValueError, TypeError) as e:
            raise ValueError(f"Numeric validation failed for table {table_fqn}: {e}")
            
        if added < 0 or removed < 0 or modified < 0 or total < 0:
            raise ValueError(f"Schema change metrics cannot be negative for table {table_fqn}")
            
        result[table_fqn] = SchemaChange(
            added_columns=added,
            removed_columns=removed,
            modified_columns=modified,
            total_columns_before=total
        )
        
    return result
