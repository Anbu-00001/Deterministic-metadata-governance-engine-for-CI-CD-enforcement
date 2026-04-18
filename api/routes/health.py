from __future__ import annotations
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/api/health")
async def health_check() -> dict:
    """Return a detailed health status as per Phase 1.2 Specs."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "engine": "sentinel",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "components": {
            "sentinel": "healthy",
            "ingestion": "healthy"
        }
    }
