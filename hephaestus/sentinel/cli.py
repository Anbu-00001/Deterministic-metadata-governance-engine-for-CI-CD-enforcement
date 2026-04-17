import typer
import json
import requests
from pathlib import Path
from sentinel.sentinel import Sentinel, SentinelInput
from sentinel.blast_radius import LineageGraph

app = typer.Typer()

@app.command()
def run_sentinel(
    pr_number: int = typer.Option(..., "--pr-number", help="PR Number"),
    changed_files: str = typer.Option(None, "--changed-files", help="Comma-separated FQN list"),
    lineage_file: Path = typer.Option(None, "--lineage-file", help="Path to lineage graph JSON"),
    input_dir: Path = typer.Option(None, "--input-dir", help="Directory containing input JSON files")
):
    if input_dir and input_dir.exists():
        from ingestion.metadata_loader import load_metadata
        from ingestion.lineage_loader import load_lineage
        from ingestion.schema_loader import load_schema_changes
        from ingestion.volume_loader import load_volume_changes
        from ingestion.input_builder import build_sentinel_input
        
        metadata = load_metadata(input_dir / "metadata.json")
        lineage = load_lineage(input_dir / "lineage.json")
        schema_changes = load_schema_changes(input_dir / "schema.json")
        volume_changes = load_volume_changes(input_dir / "volume.json")
        
        sentinel_input = build_sentinel_input(
            pr_number=pr_number,
            metadata=metadata,
            lineage=lineage,
            schema_changes=schema_changes,
            volume_changes=volume_changes
        )
    else:
        tables = [t.strip() for t in changed_files.split(",")] if changed_files else []
        
        lineage_graph = LineageGraph(edges={})
        if lineage_file and lineage_file.exists():
            with open(lineage_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                lineage_graph.edges = {k: set(v) for k, v in data.items()}
                
        sentinel_input = SentinelInput(
            pr_number=pr_number,
            changed_tables=tables,
            column_metadata={},
            lineage_graph=lineage_graph,
            schema_changes={},
            volume_changes={}
        )
    
    sentinel = Sentinel()
    decision = sentinel.evaluate(sentinel_input)
    
    print(decision.markdown_comment)
    
    if decision.verdict == "BLOCK":
        raise typer.Exit(code=1)
    raise typer.Exit(code=0)

@app.command()
def health():
    try:
        resp = requests.get("http://127.0.0.1:8000/api/health")
        if resp.status_code == 200:
            print(resp.json())
        else:
            print(f"Error {resp.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    app()
