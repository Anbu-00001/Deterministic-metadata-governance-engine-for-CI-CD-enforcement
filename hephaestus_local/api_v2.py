import uvicorn
import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Tuple
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI(title="Hephaestus Sentinel API")

G_TOKEN = os.getenv("GITHUB_TOKEN", "")
Q_HOST = os.getenv("QDRANT_HOST", "localhost")
O_HOST = os.getenv("OPENMETADATA_HOST", "mock")

MODE = "docker"
WARNING = None

try:
    print(f"Connecting to Qdrant at {Q_HOST}:6333...")
    qdrant = QdrantClient(host=Q_HOST, port=6333, timeout=3)
    qdrant.get_collections()
except Exception as e:
    print(f"WARN: Could not connect to Qdrant Docker ({e}). Using persistent disk store.")
    qdrant = QdrantClient(path="./qdrant_persistent_store")
    MODE = "local_disk"
    WARNING = "Running in local disk mode, not Docker Qdrant"

try:
    qdrant.create_collection(
        collection_name="catalog_embeddings",
        vectors_config=qmodels.VectorParams(size=384, distance=qmodels.Distance.COSINE)
    )
except Exception:
    pass

model = SentenceTransformer('all-MiniLM-L6-v2')

class SentinelRequest(BaseModel):
    pr_number: int
    repo: str

def parse_pr_diff(diff_text: str) -> Dict[str, Any]:
    # Extract added and removed columns from SQL/DBT diff
    # Simple parsing logic
    columns = []
    
    # We will try to parse changes. 
    lines = diff_text.split("\n")
    for line in lines:
        if line.startswith("+") and not line.startswith("+++"):
            # check if it looks like a column definition
            match = re.search(r"^\+\s*([a-zA-Z0-9_]+)\s+", line)
            if match:
                col_name = match.group(1)
                # Assign attributes to compute FGS dynamically
                columns.append({
                    "name": col_name,
                    "has_description": True, # Assume true for real data mock
                    "has_tag": True,
                    "tier": 2, 
                    "description": f"Extracted from PR diff: {col_name}"
                })
                
    if not columns: # Fallback if regex fails on dummy diffs
        columns = [
            {"name": "user_id", "has_description": True, "has_tag": True, "tier": 1, "description": "Unique ID"},
            {"name": "email", "has_description": True, "has_tag": False, "tier": 2, "description": "Email address"},
            {"name": "created_at", "has_description": False, "has_tag": False, "tier": 3, "description": ""}
        ]

    return {
        "model_name": "users_model",
        "columns": columns
    }

def fetch_github_pr_schema(repo: str, pr_number: int) -> Dict[str, Any]:
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"
    headers = {"Authorization": f"token {G_TOKEN}", "Accept": "application/vnd.github.v3.diff"} if G_TOKEN else {"Accept": "application/vnd.github.v3.diff"}
    
    print(f"GET {url}")
    diff_text = ""
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            diff_text = resp.text
    except Exception:
        pass
        
    return parse_pr_diff(diff_text)

def fetch_openmetadata_catalog(table_name: str) -> Dict[str, Any]:
    print(f"GET http://{O_HOST}/tables/{table_name}")
    # Simulating the OpenMetadata Mock API
    catalog = {
        "columns": [
            {"name": "user_id", "description": "Unique identifier for the user account"},
            {"name": "email", "description": "Email address of the user"},
            {"name": "created_at", "description": "Timestamp when the user was created"}
        ]
    }
    
    # Upsert to persistent Qdrant
    points = []
    for idx, col in enumerate(catalog["columns"]):
        desc = col["description"]
        emb = model.encode(desc).tolist()
        points.append(qmodels.PointStruct(id=idx+1, vector=emb, payload={"name": col["name"], "desc": desc}))
    
    qdrant.upsert(collection_name="catalog_embeddings", points=points)
    return catalog

def detect_drift(schema: dict):
    drift_flags = []
    debug_logs = []
    
    for col in schema.get("columns", []):
        s_desc = col.get("description", "")
        name = col.get("name")
        if not s_desc:
            drift_flags.append({"column": name, "score": 0.0, "drifted": True})
            debug_logs.append({"column": name, "error": "No description provided"})
            continue
        
        emb = model.encode(s_desc).tolist()
        search_result = qdrant.query_points(
            collection_name="catalog_embeddings",
            query=emb,
            query_filter=qmodels.Filter(must=[qmodels.FieldCondition(key="name", match=qmodels.MatchValue(value=name))]),
            limit=1
        )
        
        score = search_result.points[0].score if getattr(search_result, 'points', None) and search_result.points else 0.0
        drift_flags.append({"column": name, "score": round(score, 4), "drifted": score < 0.85})
        
        raw_response = str(search_result.points) if getattr(search_result, 'points', None) else "[]"
        debug_logs.append({
            "column": name,
            "vector_size": len(emb),
            "score": score,
            "raw_response": raw_response
        })
        
    return drift_flags, debug_logs

def get_node_weight(node_name):
    nl = node_name.lower()
    if "report" in nl: return 0.5
    if "mart" in nl: return 0.8
    return 1.0

def build_dynamic_lineage(model_name: str):
    # Simulate a dynamic fetch or structure
    graph = {
        "users_model": ["marts_users_enriched", "fct_orders"],
        "marts_users_enriched": ["report_user_metrics"],
        "fct_orders": ["report_revenue"],
        "report_user_metrics": [],
        "report_revenue": []
    }
    
    visited = {model_name}
    queue = [(model_name, 0)]
    blast_details = []
    r_blast_total = 0.0
    
    while queue:
        current, depth = queue.pop(0)
        if depth > 0:
            weight = get_node_weight(current)
            impact = weight / depth
            r_blast_total += impact
            blast_details.append({"node": current, "depth": depth, "weight": weight, "computed_impact": round(impact, 4)})
            
        for nb in graph.get(current, []):
            if nb not in visited:
                visited.add(nb)
                queue.append((nb, depth + 1))
                
    return r_blast_total, blast_details

def calculate_metrics(schema: dict):
    model_name = schema.get("model_name", "users_model")
    r_blast_total, blast_details = build_dynamic_lineage(model_name)
    
    tier_weights = {1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2}
    total_c_t = 0.0
    total_t = 0.0
    
    fgs_breakdown = {}
    
    for col in schema.get("columns", []):
        tier = col.get("tier", 5)
        c_i = 1.0 if (col.get("has_description") and col.get("has_tag")) else 0.0
        t_i = tier_weights.get(tier, 0.2)
        
        contribution = c_i * t_i
        total_c_t += contribution
        total_t += t_i
        
        fgs_breakdown[col.get("name")] = {
            "tier": tier,
            "c_i": c_i,
            "t_i": t_i,
            "contribution": contribution
        }
        
    fgs_base = (total_c_t / total_t) if total_t > 0 else 0.0
    fgs_raw = fgs_base - (0.1 * r_blast_total)
    fgs_final = max(0.0, min(1.0, fgs_raw))
    
    fgs_breakdown["base_fgs"] = fgs_base
    fgs_breakdown["penalty_from_blast"] = 0.1 * r_blast_total
    
    return fgs_final, fgs_breakdown, r_blast_total, blast_details

@app.post("/run-sentinel")
def run_sentinel_analysis(request: SentinelRequest):
    schema = fetch_github_pr_schema(request.repo, request.pr_number)
    fetch_openmetadata_catalog(schema.get("model_name", "users_model"))
    
    drift_flags, drift_debug = detect_drift(schema)
    fgs, fgs_breakdown, blast_radius, blast_details = calculate_metrics(schema)
    
    decision = "BLOCKED" if fgs < 0.6 else "PASSED"
    
    github_comment_url = f"https://api.github.com/repos/{request.repo}/issues/{request.pr_number}/comments"
    
    comment_body = (
        "Hephaestus Sentinel Report:\\n"
        f"FGS: {round(fgs, 4)} ❌\\n"
        f"Blast Radius: {round(blast_radius, 4)}\\n"
        f"Drift: {len([d for d in drift_flags if d['drifted']])} issue(s) detected\\n\\n"
        f"🚫 {decision}: Governance threshold not met"
    )
    
    print(f"\\n--- MOCK GITHUB API COMMENT ---")
    print(f"POST {github_comment_url}")
    print(f"Body:\\n{comment_body}")
    print(f"-------------------------------")
    
    response_payload = {
        "fgs": round(fgs, 4),
        "fgs_breakdown": fgs_breakdown,
        "blast_radius": round(blast_radius, 4),
        "blast_details": blast_details,
        "drift_flags": drift_flags,
        "drift_debug": drift_debug,
        "decision": decision,
        "mode": MODE
    }
    
    if WARNING:
        response_payload["warning"] = WARNING
        
    return response_payload

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8006)
