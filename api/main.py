"""
Module: main.py
Purpose: Hephaestus API — FastAPI application factory.
"""

from __future__ import annotations
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health, rollback, timeline, sentinel, logs, optimize
from config import settings

@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    # Initialise in-memory snapshot store if needed
    application.state.snapshots = []
    yield

app = FastAPI(
    title="Hephaestus API",
    description="Deterministic Governance Engine API",
    version="1.0.0",
    lifespan=lifespan,
)

# Phase 1.4: CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with Phase 1.2/1.3 requirements
app.include_router(health.router)
app.include_router(sentinel.router, prefix="/api/sentinel")
app.include_router(timeline.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(optimize.router, prefix="/api")
app.include_router(rollback.router, prefix="/api/v1")
