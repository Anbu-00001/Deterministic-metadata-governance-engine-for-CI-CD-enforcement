from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import os
import random
import math
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer

# Initialization
app = FastAPI(title="Hephaestus Sentinel API")

# Initialize Qdrant and encode model globally
qdrant = QdrantClient(":memory:")
try:
    qdrant.recreate_collection(
        collection_name="catalog_embeddings",
        vectors_config=qmodels.VectorParams(size=384, distance=qmodels.Distance.COSINE)
    )
except Exception:
    pass

model = SentenceTransformer('all-MiniLM-L6-v2')

class SentinelRequest(BaseModel):
    pr_number: int
    repo: str

# 1. MOCK GITHUB: Simulated fetch of changed files & new schema
def fetch_github_pr_schema(repo: str, pr_number: int) -> Dict[str, Any]:
    # Simulate a GitHub API response for a changed dbt model
    return {
        "model_name": "users_model",
        "columns": [
            {"name": "user_id", "has_description": True, "has_tag": True, "tier": 1, "description": "Unique identifier for the user"},
            {"name": "email", "has_description": True, "has_tag": False, "tier": 2, "description": "Email address of the user"},
            {"name": "created_at", "has_description": False, "has_tag": False, "tier": 3, "description": ""}
        ]
    }

# 2. MOCK OPENMETADATA: Simulated fetch of catalog metadata & upserting to Qdrant
def fetch_openmetadata_catalog(table_name: str) -> Dict[str, Any]:
    catalog = {
        "columns": [
            {"name": "user_id", "description": "Unique identifier for the user account"},
            {"name": "email", "description": "Email address of the user"},
            {"name": "created_at", "description": "Timestamp when the user was created"}
        ]
    }
    
    # Store these embeddings in Qdrant for real semantic search
    points = []
    for idx, col in enumerate(catalog["columns"]):
        desc = col["description"]
        emb = model.encode(desc).tolist()
        points.append(
            qmodels.PointStruct(id=idx+1, vector=emb, payload={"name": col["name"], "desc": desc})
        )
    qdrant.upsert(collection_name="catalog_embeddings", points=points)
    return catalog

# 3. CALCULATIONS
def get_node_weight(node_name):
    nl = node_name.lower()
    if "report" in nl: return 0.5
    if "mart" in nl: return 0.8
    return 1.0

def calculate_fgs_and_blast(schema: dict):
    # Simulated lineage graph for the blast radius
    graph = {
        "users_model": ["marts_users_enriched", "fct_orders"],
        "marts_users_enriched": ["report_user_metrics"],
        "fct_orders": ["report_revenue"],
        "report_user_metrics": [],
        "report_revenue": []
    }
    
    model_name = schema.get("model_name", "")
    r_blast_total = 0.0
    if model_name in graph:
        visited = {model_name}
        queue = [(model_name, 0)]
        while queue:
            current, depth = queue.pop(0)
            if depth > 0:
                weight = get_node_weight(current)
                r_blast_total += weight / depth
            for nb in graph.get(current, []):
                if nb not in visited:
                    visited.add(nb)
                    queue.append((nb, depth + 1))
    
    # FGS Base
    tier_weights = {1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2}
    total_c_t, total_t = 0.0, 0.0
    for col in schema.get("columns", []):
        tier = col.get("tier", 5)
        c_i = 1.0 if (col.get("has_description") and col.get("has_tag")) else 0.0
        t_i = tier_weights.get(tier, 0.2)
        total_c_t += c_i * t_i
        total_t += t_i
        
    fgs_base = (total_c_t / total_t) if total_t > 0 else 0.0
    fgs_raw = fgs_base - (0.1 * r_blast_total)
    return max(0.0, min(1.0, fgs_raw)), r_blast_total

# 4. DRIFT with Qdrant Vector Search
def detect_drift(schema: dict) -> List[dict]:
    drift_flags = []
    
    for col in schema.get("columns", []):
        s_desc = col.get("description", "")
        name = col.get("name")
        
        if not s_desc:
            drift_flags.append({"column": name, "score": 0.0, "drifted": True})
            continue
            
        emb = model.encode(s_desc).tolist()
        
        # Real Qdrant vector search
        search_result = qdrant.query_points(
            collection_name="catalog_embeddings",
            query=emb,
            query_filter=qmodels.Filter(
                must=[qmodels.FieldCondition(key="name", match=qmodels.MatchValue(value=name))]
            ),
            limit=1
        )
        
        score = search_result.points[0].score if search_result and hasattr(search_result, 'points') and search_result.points else (search_result[0].score if isinstance(search_result, list) and len(search_result) > 0 else 0.0)
        drift_flags.append({"column": name, "score": round(score, 4), "drifted": score < 0.85})
        
    return drift_flags

# --- ENDPOINTS ---

@app.post("/run-sentinel")
def run_sentinel_analysis(request: SentinelRequest):
    # 1. Fetch
    schema = fetch_github_pr_schema(request.repo, request.pr_number)
    fetch_openmetadata_catalog(schema.get("model_name", "users_model"))
    
    # 2. Compute
    fgs, blast_radius = calculate_fgs_and_blast(schema)
    drift_flags = detect_drift(schema)
    
    decision = "BLOCK" if fgs < 0.6 else "PASS"
    
    return {
        "fgs": round(fgs, 4),
        "blast_radius": round(blast_radius, 4),
        "drift_flags": drift_flags,
        "decision": decision
    }

@app.post("/webhook/github")
def github_webhook(payload: dict):
    # Automatically triggers analysis when GitHub hook fires (e.g. PR opened/synchronized)
    pr_number = payload.get("pull_request", {}).get("number", 1)
    repo = payload.get("repository", {}).get("full_name", "owner/repo")
    
    req = SentinelRequest(pr_number=pr_number, repo=repo)
    return run_sentinel_analysis(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)






