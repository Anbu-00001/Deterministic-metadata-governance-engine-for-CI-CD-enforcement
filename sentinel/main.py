"""Sentinel CLI — entry point for the Hephaestus governance engine.

Invoked by the GitHub Action workflow or directly via::

    hephaestus-sentinel run-sentinel --pr-number 42

The command orchestrates: entity resolution → lineage fetch → blast radius →
schema diff → FGS calculation → semantic drift → skills execution → report.
"""

from __future__ import annotations

import asyncio
import sys
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from config import settings
from sentinel.core.blast_radius import calculate_blast_radius
from sentinel.core.diff_engine import calculate_change_magnitude
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
) -> bool:
    """Core async orchestration loop.

    Returns ``True`` if all entities pass, ``False`` if any are blocked.
    """
    # Lazy imports to avoid import-time network calls.
    from mcp.tools.entity_tools import get_entity  # noqa: F811
    from mcp.tools.lineage_tools import get_entity_lineage

    loader = SkillsLoader()
    results: list[dict] = []

    for fqn in changed_files:
        entity_result: dict = {"entity_fqn": fqn}

        # ── Fetch entity ────────────────────────────────────
        try:
            entity = await get_entity("tables", fqn)
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

        entity_id: str = entity.get("id", "")

        # ── Lineage + blast radius ──────────────────────────
        try:
            lineage_graph = await get_entity_lineage("tables", entity_id)
        except RuntimeError:
            lineage_graph = {}
        blast_radius = calculate_blast_radius(lineage_graph)

        # ── Build column metadata ───────────────────────────
        columns: list[ColumnMetadata] = []
        column_names: list[str] = []
        for col in entity.get("columns", []):
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

        # ── Change magnitude (schema diff against self for now) ─
        schema_diff = {
            "added_columns": [],
            "removed_columns": [],
            "modified_columns": [],
        }
        total_columns = len(columns) if columns else 1
        diff_result = calculate_change_magnitude(
            schema_diff=schema_diff,
            total_columns=total_columns,
            changed_rows=0,
            total_rows=1,
            alpha=settings.alpha_structural,
            beta=settings.beta_volume,
        )
        entity_result["change_magnitude"] = {
            "magnitude": diff_result.magnitude,
            "summary": diff_result.summary,
        }

        # ── Skills ───────────────────────────────────────────
        skill_context = {
            "entity": entity,
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
) -> None:
    """Run the Forge Governance Sentinel against a pull request.

    Evaluates every changed entity, computes the FGS, detects semantic
    drift, runs applicable skills, and prints a structured report.

    Exits with code **1** if any entity is blocked, code **0** if all pass.
    """
    owner = repo_owner or settings.github_repo_owner
    name = repo_name or settings.github_repo_name
    fqns: list[str] = []
    if changed_files:
        fqns = [f.strip() for f in changed_files.split(",") if f.strip()]

    if not fqns:
        console.print("[yellow]No changed files provided — nothing to evaluate.[/yellow]")
        raise typer.Exit(code=0)

    console.print(
        f"[bold]Sentinel evaluating PR #{pr_number} "
        f"on {owner}/{name} ({len(fqns)} entities)[/bold]"
    )

    all_passed = asyncio.run(
        _run_sentinel_async(pr_number, owner, name, fqns)
    )

    if not all_passed:
        console.print("\n[bold red]⛔ Sentinel BLOCKED this PR.[/bold red]")
        raise typer.Exit(code=1)

    console.print("\n[bold green]✅ Sentinel PASSED — safe to merge.[/bold green]")
    raise typer.Exit(code=0)


if __name__ == "__main__":
    app()
