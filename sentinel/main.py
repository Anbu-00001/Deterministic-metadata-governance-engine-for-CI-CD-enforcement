"""
Module: main.py

Purpose:
Orchestrates core governance capabilities via CLI and reporting logic for main.py.

Responsibilities:
- Handles specific `main.py` domain logic
- Integrates seamlessly with sibling modules
- Adheres strictly to Hephaestus governance constraints

Part of: Hephaestus Governance Engine

Sentinel CLI — entry point for the Hephaestus governance engine.

Invoked by the GitHub Action workflow or directly via::

    hephaestus-sentinel run-sentinel --pr-number 42

The command orchestrates: entity resolution → lineage fetch → blast radius →
schema diff → FGS calculation → semantic drift → skills execution → report.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from config import settings
from sentinel.core.blast_radius import calculate_blast_radius
from sentinel.core.diff_engine import calculate_change_magnitude, SchemaChange, VolumeChange
from sentinel.core.fgs import ColumnMetadata, calculate_fgs
from sentinel.report import build_pr_comment
from sentinel.skills.skills_loader import SkillsLoader

app = typer.Typer(
    name="hephaestus-sentinel",
    help="Forge Governance Sentinel — deterministic metadata compliance enforcer.",
    add_completion=False,
)
console = Console()


async def _run_sentinel_async(
    pr_number: int,
    repo_owner: str,
    repo_name: str,
    changed_files: list[str],
    input_dir: Optional[Path] = None,
) -> bool:
    """Core async orchestration loop.

    Returns ``True`` if all entities pass, ``False`` if any are blocked.
    """
    # Lazy imports to avoid import-time network calls.
    from mcp_server.tools.entity_tools import get_entity  # noqa: F811
    from mcp_server.tools.lineage_tools import get_entity_lineage

    loader = SkillsLoader()
    results: list[dict] = []
    
    # Optional offline data loading
    offline_metadata = {}
    offline_lineage = {}
    offline_schema = {}
    offline_volume = {}
    
    if input_dir and input_dir.exists():
        from ingestion.metadata_loader import load_metadata
        from ingestion.lineage_loader import load_lineage
        from ingestion.schema_loader import load_schema_changes
        from ingestion.volume_loader import load_volume_changes
        
        try:
            offline_metadata = load_metadata(input_dir / "metadata.json")
            offline_lineage = load_lineage(input_dir / "lineage.json")
            offline_schema = load_schema_changes(input_dir / "schema.json")
            offline_volume = load_volume_changes(input_dir / "volume.json")
            console.print("[green]Loaded offline ingestion data successfully.[/green]")
        except Exception as e:
            console.print(f"[yellow]Warning: Could not load some offline data: {e}[/yellow]")

    for fqn in changed_files:
        entity_result: dict = {"entity_fqn": fqn}
        columns_data = []

        # ── Fetch entity ────────────────────────────────────
        if input_dir and fqn in offline_metadata:
             columns_data = [{"name": c.name, "description": c.description, "tags": getattr(c, "governance_tags", []), "criticality_tier": getattr(c, "tier", 3)} for c in offline_metadata[fqn]]
        else:
            try:
                entity = await get_entity("tables", fqn)
                columns_data = entity.get("columns", [])
            except RuntimeError as exc:
                console.print(f"[red]✗ Could not fetch entity {fqn}: {exc}[/red]")
                entity_result["fgs"] = {
                    "score": 0.0,
                    "compliance_score": 0.0,
                    "blast_penalty": 0.0,
                    "blast_radius": 0,
                    "is_blocked": True,
                    "explanation": f"Entity fetch failed: {exc}",
                }
                results.append(entity_result)
                continue

        # ── Lineage + blast radius ──────────────────────────
        if input_dir:
            lineage_graph = offline_lineage.edges if hasattr(offline_lineage, "edges") else {}
        else:
            try:
                # Need entity_id which we only have online
                entity_id = entity.get("id", "")
                lineage_graph = await get_entity_lineage("tables", entity_id)
            except RuntimeError:
                lineage_graph = {}
        blast_radius = calculate_blast_radius(lineage_graph)

        # ── Build column metadata ───────────────────────────
        columns: list[ColumnMetadata] = []
        column_names: list[str] = []
        for col in columns_data:
            col_name = col.get("name", "")
            column_names.append(col_name)
            has_description = bool(col.get("description", "").strip())
            has_tags = bool(col.get("tags", []))
            tier = col.get("criticality_tier", 3)
            columns.append(
                ColumnMetadata(
                    name=col_name,
                    is_documented=has_description and has_tags,
                    criticality_tier=tier,
                )
            )

        # ── FGS ──────────────────────────────────────────────
        fgs_result = calculate_fgs(
            columns=columns,
            blast_radius=blast_radius,
            lambda_decay=settings.lambda_decay,
            threshold=settings.fgs_block_threshold,
        )
        entity_result["fgs"] = {
            "score": fgs_result.score,
            "compliance_score": fgs_result.compliance_score,
            "blast_penalty": fgs_result.blast_penalty,
            "blast_radius": fgs_result.blast_radius,
            "is_blocked": fgs_result.is_blocked,
            "explanation": fgs_result.explanation,
        }

        # ── Change magnitude ─────────────────────────────────
        total_columns = len(columns) if columns else 1
        
        if input_dir and fqn in offline_schema and fqn in offline_volume:
            sch = offline_schema[fqn]
            vol = offline_volume[fqn]
            schema_change = SchemaChange(added_columns=sch.added_columns, removed_columns=sch.removed_columns, modified_columns=sch.modified_columns, total_columns_before=sch.total_columns_before)
            volume_change = VolumeChange(changed_rows=vol.changed_rows, total_rows=vol.total_rows)
        else:
            schema_change = SchemaChange(added_columns=0, removed_columns=0, modified_columns=0, total_columns_before=total_columns)
            volume_change = VolumeChange(changed_rows=0, total_rows=1)
            
        diff_result = calculate_change_magnitude(
            schema_change=schema_change,
            volume_change=volume_change,
            alpha=settings.alpha_structural,
            beta=settings.beta_volume,
        )
        entity_result["change_magnitude"] = {
            "magnitude": diff_result.magnitude,
            "summary": diff_result.summary,
        }

        # ── Skills ───────────────────────────────────────────
        skill_context = {
            "entity": {"columns": columns_data} if input_dir else entity,
            "columns": columns_data, # Added to support PII skill description scanning
            "column_names": column_names,
            "lineage_graph": lineage_graph,
            "entity_fqn": fqn,
        }
        applicable_skills = await loader.load_applicable(skill_context)
        skills_findings: list[dict] = []
        for skill in applicable_skills:
            try:
                finding = await skill.execute(skill_context)
                skills_findings.append({"skill": skill.name, "result": finding})
            except Exception as exc:
                skills_findings.append(
                    {"skill": skill.name, "result": {"error": str(exc)}}
                )
        entity_result["skills_findings"] = skills_findings

        # ── AI Insight Enhancement (OPTIONAL, NON-BREAKING) ──
        try:
            from ai.insight_generator import generate_insight
            ai_input = {
                "fqn": fqn,
                "metadata": columns_data,
                "lineage": lineage_graph,
                "diff": entity_result.get("change_magnitude")
            }
            ai_decision = entity_result.get("fgs")
            entity_result["ai_insight"] = generate_insight(ai_input, ai_decision)
        except Exception:
            entity_result["ai_insight"] = {"summary": "AI unavailable", "risks": [], "suggestions": []}

        results.append(entity_result)

        results.append(entity_result)

    # ── Console output ───────────────────────────────────────
    table = Table(title=f"Sentinel Results — PR #{pr_number}")
    table.add_column("Entity", style="cyan")
    table.add_column("FGS", justify="right")
    table.add_column("Blast", justify="right")
    table.add_column("Verdict", style="bold")

    any_blocked = False
    for r in results:
        fgs = r.get("fgs", {})
        score = fgs.get("score", 0.0)
        blocked = fgs.get("is_blocked", False)
        if blocked:
            any_blocked = True
        verdict = "[red]BLOCKED[/red]" if blocked else "[green]PASSED[/green]"
        table.add_row(
            r.get("entity_fqn", "?"),
            f"{score:.2f}",
            str(fgs.get("blast_radius", 0)),
            verdict,
        )

    console.print(table)

    # ── Generate PR comment ──────────────────────────────────
    comment = build_pr_comment(results)
    console.print("\n[bold]PR Comment Preview:[/bold]\n")
    console.print(comment)

    return not any_blocked


@app.command()
def run_sentinel(
    pr_number: int = typer.Option(
        0,
        "--pr-number",
        envvar="PR_NUMBER",
        help="GitHub PR number being evaluated.",
    ),
    repo_owner: str = typer.Option(
        "",
        "--repo-owner",
        envvar="REPO_OWNER",
        help="GitHub repo owner (org or user).",
    ),
    repo_name: str = typer.Option(
        "",
        "--repo-name",
        envvar="REPO_NAME",
        help="GitHub repository name.",
    ),
    changed_files: Optional[str] = typer.Option(
        None,
        "--changed-files",
        envvar="CHANGED_FILES",
        help="Comma-separated list of changed entity FQNs.",
    ),
    input_dir: Optional[Path] = typer.Option(
        None,
        "--input-dir",
        help="Directory containing JSON files for offline testing.",
    ),
) -> None:
    """Run the Forge Governance Sentinel against a pull request.

    Evaluates every changed entity, computes the FGS, detects semantic
    drift, runs applicable skills, and prints a structured report.

    Exits with code **1** if any entity is blocked, code **0** if all pass.
    """
    owner = repo_owner or settings.github_repo_owner
    name = repo_name or settings.github_repo_name
    fqns: list[str] = []
    
    if input_dir and input_dir.exists():
        from ingestion.metadata_loader import load_metadata
        try:
            meta = load_metadata(input_dir / "metadata.json")
            fqns = list(meta.keys())
        except Exception:
            pass
            
    if changed_files:
        fqns.extend([f.strip() for f in changed_files.split(",") if f.strip()])

    if not fqns:
        console.print("[yellow]No changed files provided — nothing to evaluate.[/yellow]")
        raise typer.Exit(code=0)

    console.print(
        f"[bold]Sentinel evaluating PR #{pr_number} "
        f"on {owner}/{name} ({len(fqns)} entities)[/bold]"
    )

    all_passed = asyncio.run(
        _run_sentinel_async(pr_number, owner, name, fqns, input_dir=input_dir)
    )

    if not all_passed:
        console.print("\n[bold red]⛔ Sentinel BLOCKED this PR.[/bold red]")
        raise typer.Exit(code=1)

    console.print("\n[bold green]✅ Sentinel PASSED — safe to merge.[/bold green]")
    raise typer.Exit(code=0)


if __name__ == "__main__":
    app()

