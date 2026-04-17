import json
from pathlib import Path
from dataclasses import dataclass

@dataclass
class IngestedColumn:
    name: str
    description: str
    governance_tags: list[str]
    tier: int

def load_metadata(path: Path) -> dict[str, list[IngestedColumn]]:
    if not path.exists():
        raise FileNotFoundError(f"Metadata file not found: {path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if not isinstance(data, dict):
        raise ValueError("Metadata root must be a dict mapping table_fqn to list of columns")
        
    result = {}
    for table_fqn, columns_data in data.items():
        if not isinstance(columns_data, list):
            raise ValueError(f"Columns for table {table_fqn} must be a list")
            
        columns = []
        for col in columns_data:
            if not isinstance(col, dict):
                raise ValueError(f"Column entry in {table_fqn} must be a dict")
            if "name" not in col:
                raise ValueError(f"Column missing 'name' in {table_fqn}")
                
            name = str(col["name"])
            description = str(col.get("description", ""))
            
            tags_raw = col.get("governance_tags", [])
            if not isinstance(tags_raw, list):
                tags_raw = [str(tags_raw)]
            tags = [str(t) for t in tags_raw]
            
            try:
                tier = int(col.get("tier", 0))
            except (ValueError, TypeError):
                tier = 0
                
            columns.append(IngestedColumn(
                name=name,
                description=description,
                governance_tags=tags,
                tier=tier
            ))
            
        result[table_fqn] = columns
        
    return result
