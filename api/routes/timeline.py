from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Request
from datetime import datetime
import uuid

router = APIRouter(tags=["timeline"])

@router.get("/timeline")
async def get_timeline(request: Request) -> list[dict[str, Any]]:
    """Return the full snapshot timeline as per Phase 1.2 shape."""
    snapshots: list[dict[str, Any]] = request.app.state.snapshots
    
    # Map internal snapshots to Phase 1.2 external contract
    timeline = []
    for snap in snapshots:
        timeline.append({
            "id": snap.get("id", str(uuid.uuid4())),
            "timestamp": snap.get("timestamp", datetime.utcnow().isoformat() + "Z"),
            "action": "EVALUATE",
            "decision": snap.get("decision", "APPROVE"),
            "fgs_score": snap.get("score" if "score" in snap else "fgs_score", 0.0),
            "input_summary": f"Target: {snap.get('label', 'automatic_capture')}"
        })
    
    # Return mock history if empty to ensure UI has data to render as requested
    if not timeline:
        return [
            {
                "id": "hist_01",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "action": "INITIAL_AUDIT",
                "decision": "APPROVE",
                "fgs_score": 92.4,
                "input_summary": "Baseline Genesis Estate"
            }
        ]
        
    return timeline

@router.post("/snapshot")
async def create_snapshot(request: Request, body: dict):
    # Thin wrapper for persistence
    snap = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "label": body.get("label", "manual"),
        "score": body.get("score", 0.0),
        "decision": body.get("decision", "REVIEW")
    }
    request.app.state.snapshots.append(snap)
    return snap
