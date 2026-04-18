"""
Module: main.py

Purpose:
Provides API endpoints and server routes for main.py within the Hephaestus web service layer.

Responsibilities:
- Handles specific `main.py` domain logic
- Integrates seamlessly with sibling modules
- Adheres strictly to Hephaestus governance constraints

Part of: Hephaestus Governance Engine

Hephaestus API — FastAPI application factory.

Registers all route modules and configures CORS for the Chronos
dashboard.  Snapshots are stored in-memory on ``app.state.snapshots``
today; the structure is designed to be swapped for a database later
without changing any route code.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health, rollback, timeline, sentinel
from config import settings


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — initialise and tear down shared state."""
    # Initialise in-memory snapshot store.
    application.state.snapshots: list[dict] = []
    yield
    # Cleanup (no-op today; ready for DB connection teardown later).


app = FastAPI(
    title="Hephaestus API",
    description="Chronos timeline, snapshot, and rollback endpoints for the Hephaestus governance engine.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS — allow the dashboard origin ────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.dashboard_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────
app.include_router(health.router)
app.include_router(timeline.router, prefix="/api/v1")
app.include_router(rollback.router, prefix="/api/v1")
app.include_router(sentinel.router, prefix="/api")

