from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from typing import Any, Dict
from pydantic import BaseModel
import asyncio

from sentinel.core.blast_radius import calculate_blast_radius
from sentinel.core.diff_engine import calculate_change_magnitude, SchemaChange, VolumeChange
from sentinel.core.fgs import ColumnMetadata, calculate_fgs
from config import settings

router = APIRouter(tags=["sentinel"])

class EvaluateRequest(BaseModel):
    metadata: dict[str, Any] = {}
    lineage: dict[str, Any] = {}
    schema_change: dict[str, Any] = {}
    volume_change: dict[str, Any] = {}

@router.post("/sentinel/evaluate")
async def evaluate_sentinel(body: EvaluateRequest, request: Request) -> list[dict[str, Any]]:
    """Evaluate a metadata payload against the governance rules in real time."""
    results = []
    
    # Iterate over provided metadata entities
    for fqn, columns_data in body.metadata.items():
        entity_result: dict[str, Any] = {"entity_fqn": fqn}
        
        # Calculate blast radius from lineage graph
        lineage_graph = body.lineage if isinstance(body.lineage, dict) else {}
        blast_radius = calculate_blast_radius(lineage_graph)
        
        # Build column metadata
        columns = []
        for col_name, col_info in columns_data.items():
            has_desc = bool(col_info.get("description", "").strip())
            has_tags = bool(col_info.get("tags", []))
            tier = col_info.get("tier", 3)
            columns.append(
                ColumnMetadata(
                    name=col_name,
                    is_documented=has_desc and has_tags,
                    criticality_tier=tier,
                )
            )
            
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
        
        # Change Magnitude
        sch = body.schema_change.get(fqn, {})
        vol = body.volume_change.get(fqn, {})
        
        schema_change = SchemaChange(
            added_columns=sch.get("added_columns", 0),
            removed_columns=sch.get("removed_columns", 0),
            modified_columns=sch.get("modified_columns", 0),
            total_columns_before=sch.get("total_columns_before", len(columns) if columns else 1)
        )
        volume_change = VolumeChange(
            changed_rows=vol.get("changed_rows", 0),
            total_rows=vol.get("total_rows", 1)
        )
        
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
        
        entity_result["skills_findings"] = [] # Simple mock for real-time endpoint
        
        results.append(entity_result)
        
    if not results:
        # Fallback if empty metadata provided to test the UI functionality
        entity_result = {"entity_fqn": "example_table"}
        fgs_result = calculate_fgs(
            columns=[ColumnMetadata("id", True, 1)],
            blast_radius=2,
            lambda_decay=settings.lambda_decay,
            threshold=settings.fgs_block_threshold,
        )
        entity_result["fgs"] = {
            "score": fgs_result.score,
            "compliance_score": fgs_result.compliance_score,
            "blast_penalty": fgs_result.blast_penalty, "blast_radius": fgs_result.blast_radius,
            "is_blocked": fgs_result.is_blocked, "explanation": fgs_result.explanation,
        }
        diff_result = calculate_change_magnitude(SchemaChange(0,0,0,1), VolumeChange(0,1), 0.7, 0.3)
        entity_result["change_magnitude"] = {"magnitude": diff_result.magnitude, "summary": diff_result.summary}
        entity_result["skills_findings"] = [{"skill": "Data Contract Validation", "result": {"passed": True, "score": 100}}]
        results.append(entity_result)

    return results
