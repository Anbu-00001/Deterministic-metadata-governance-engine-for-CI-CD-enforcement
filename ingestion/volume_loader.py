import json
from pathlib import Path
from sentinel.core.diff_engine import VolumeChange

def load_volume_changes(path: Path) -> dict[str, VolumeChange]:
    if not path.exists():
        raise FileNotFoundError(f"Volume file not found: {path}")
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not isinstance(data, dict):
        raise ValueError("Volume root must be a dict mapping table_fqn to changes")
        
    result = {}
    for table_fqn, change in data.items():
        if not isinstance(change, dict):
            raise ValueError(f"Volume change for {table_fqn} must be a dict")
            
        try:
            changed = int(change.get("changed_rows", 0))
            total = int(change.get("total_rows", 0))
        except (ValueError, TypeError) as e:
            raise ValueError(f"Numeric validation failed for table {table_fqn}: {e}")
            
        if changed < 0 or total < 0:
            raise ValueError(f"Volume change metrics cannot be negative for table {table_fqn}")
            
        if changed > total and total > 0:
            changed = total
            
        result[table_fqn] = VolumeChange(
            changed_rows=changed,
            total_rows=total
        )
        
    return result
