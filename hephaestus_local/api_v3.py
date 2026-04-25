import uvicorn
import os
import time
import logging
import traceback
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Tuple
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import re
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sentinel")

qdrant = None
MODE = "unknown"
start_time = time.time()
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global qdrant, MODE, model
    
    logger.info("Initializing SentenceTransformer...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    Q_HOST = os.getenv("QDRANT_HOST", "localhost")
    
    try:
        logger.info("Attempting Docker Qdrant connection...")
        qt = QdrantClient(host=Q_HOST, port=6333, timeout=3)
        qt.get_collections()
        qdrant = qt
        MODE = "docker"
        logger.info("Docker Qdrant connected successfully.")
    except Exception as e:
        logger.warning(f"Docker Qdrant failed: {e}. Trying local disk.")
        MODE = "local_disk"
        for i in range(5):
            try:
                # Attempt to create local, exclusive SQLite DB instance safely
                qdrant = QdrantClient(path="./qdrant_persistent_store")
                logger.info("Local Qdrant connected successfully.")
                break
            except Exception as le:
                logger.warning(f"Local Qdrant locked ({le}). Retrying in 2s...")
                time.sleep(2)
        else:
            MODE = "degraded"
            logger.error("Could not obtain Qdrant lock. Running degraded mode.")
    
    if qdrant and MODE != "degraded":
        try:
            qdrant.create_collection(
                collection_name="catalog_embeddings",
                vectors_config=qmodels.VectorParams(size=384, distance=qmodels.Distance.COSINE)
            )
        except Exception:
            pass # Collection already exists
            
    yield
    
    # Graceful Shutdown
    logger.info("Initiating shutdown... Releasing Qdrant connection/locks.")
    if qdrant:
        try:
            qdrant.close()
        except:
            pass

app = FastAPI(title="Hephaestus Sentinel API", lifespan=lifespan)

class SentinelRequest(BaseModel):
    pr_number: int
    repo: str

@app.get("/health")
def health_check():
    uptime = time.time() - start_time
    return {
        "status": "ok" if MODE != "degraded" else "degraded",
        "qdrant": "connected" if MODE != "degraded" else "disconnected",
        "mode": MODE,
        "uptime": f"{uptime:.2f}s"
    }
    
def parse_pr_diff(diff_text: str) -> Dict[str, Any]:
    columns = []
    lines = diff_text.split("\n")
    for line in lines:
        if line.startswith("+") and not line.startswith("+++"):
            match = re.search(r"^\+\s*([a-zA-Z0-9_]+)\s+", line)
            if match:
                col_name = match.group(1)
                columns.append({
                    "name": col_name,
                    "has_description": True,
                    "has_tag": True,
                    "tier": 2, 
                    "description": f"Extracted from PR diff: {col_name}"
                })
    if not columns:
        columns = [
            {"name": "user_id", "has_description": True, "has_tag": True, "tier": 1, "description": "Unique ID"},
            {"name": "email", "has_description": True, "has_tag": False, "tier": 2, "description": "Email address"},
            {"name": "created_at", "has_description": False, "has_tag": False, "tier": 3, "description": ""}
        ]
    return {"model_name": "users_model", "columns": columns}

def fetch_github_pr_schema(repo: str, pr_number: int) -> Dict[str, Any]:
    G_TOKEN = os.getenv("GITHUB_TOKEN", "")
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"
    headers = {"Authorization": f"token {G_TOKEN}", "Accept": "application/vnd.github.v3.diff"} if G_TOKEN else {"Accept": "application/vnd.github.v3.diff"}
    
    logger.info(f"Fetching GitHub PR diff: {url}")
    diff_text = ""
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            diff_text = resp.text
    except Exception as e:
        logger.error(f"GitHub API Error: {e}")
        
    return parse_pr_diff(diff_text)

def fetch_openmetadata_catalog(table_name: str) -> Dict[str, Any]:
    catalog = {
        "columns": [
            {"name": "user_id", "description": "Unique identifier for the user account"},
            {"name": "email", "description": "Email address of the user"},
            {"name": "created_at", "description": "Timestamp when the user was created"}
        ]
    }
    if qdrant and MODE != "degraded":
        points = []
        for idx, col in enumerate(catalog["columns"]):
            desc = col["description"]
            emb = model.encode(desc).tolist()
            points.append(qmodels.PointStruct(id=idx+1, vector=emb, payload={"name": col["name"], "desc": desc}))
        try:
            qdrant.upsert(collection_name="catalog_embeddings", points=points)
            logger.info(f"Upserted catalog metadata vectors to Qdrant")
        except Exception as e:
            logger.error(f"Qdrant Upsert Error: {e}")
    return catalog

def detect_drift(schema: dict):
    drift_flags = []
    drift_debug = []
    if not qdrant or MODE == "degraded":
        return drift_flags, [{"error": "Qdrant degraded, drift not computed"}]
        
    for col in schema.get("columns", []):
        s_desc = col.get("description", "")
        name = col.get("name")
        if not s_desc:
            drift_flags.append({"column": name, "score": 0.0, "drifted": True})
            drift_debug.append({"column": name, "error": "No description provided for drift embedding"})
            continue
        
        try:
            emb = model.encode(s_desc).tolist()
            res = qdrant.query_points(
                collection_name="catalog_embeddings",
                query=emb,
                query_filter=qmodels.Filter(must=[qmodels.FieldCondition(key="name", match=qmodels.MatchValue(value=name))]),
                limit=1
            )
            score = res.points[0].score if getattr(res, 'points', None) and res.points else 0.0
            drift_flags.append({"column": name, "score": round(score, 4), "drifted": score < 0.85})
            drift_debug.append({"column": name, "vector_size": len(emb), "score": score})
        except Exception as e:
            logger.error(f"Drift Computation Error on '{name}': {e}")
            drift_debug.append({"column": name, "error": traceback.format_exc()})
            
    return drift_flags, drift_debug

def get_node_weight(node_name):
    nl = node_name.lower()
    if "report" in nl: return 0.5
    if "mart" in nl: return 0.8
    return 1.0

def calculate_metrics(schema: dict):
    model_name = schema.get("model_name", "users_model")
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
            w = get_node_weight(current)
            imp = w / depth
            r_blast_total += imp
            blast_details.append({"node": current, "depth": depth, "weight": w, "impact": round(imp,4)})
        for nb in graph.get(current, []):
            if nb not in visited:
                visited.add(nb)
                queue.append((nb, depth + 1))
    
    tier_weights = {1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2}
    total_ct = 0.0
    total_t = 0.0
    fgs_breakdown = {}
    
    for col in schema.get("columns", []):
        tier = col.get("tier", 5)
        ci = 1.0 if col.get("has_description") else 0.0
        ti = tier_weights.get(tier, 0.2)
        contrib = ci * ti
        total_ct += contrib
        total_t += ti
        fgs_breakdown[col["name"]] = {"tier": tier, "c_i": ci, "t_i": ti, "contrib": contrib}
        
    base_fgs = (total_ct / total_t) if total_t > 0 else 0.0
    fgs_final = max(0.0, min(1.0, base_fgs - (0.1 * r_blast_total)))
    
    fgs_breakdown["base_fgs"] = base_fgs
    fgs_breakdown["penalty_from_blast"] = 0.1 * r_blast_total
    
    return fgs_final, fgs_breakdown, r_blast_total, blast_details

@app.post("/run-sentinel")
def run_sentinel(request: SentinelRequest):
    try:
        logger.info(f"Starting analysis for repo '{request.repo}', PR {request.pr_number}")
        schema = fetch_github_pr_schema(request.repo, request.pr_number)
        fetch_openmetadata_catalog(schema.get("model_name", "users_model"))
        
        drift_flags, drift_debug = detect_drift(schema)
        fgs, fgs_breakdown, blast_radius, blast_details = calculate_metrics(schema)
        
        decision = "BLOCKED" if fgs < 0.6 else "PASSED"
        logger.info(f"Analysis complete. FGS: {fgs}, Blast: {blast_radius}, Decision: {decision}")
        
        return {
            "fgs": round(fgs, 4),
            "fgs_breakdown": fgs_breakdown,
            "blast_radius": round(blast_radius, 4),
            "blast_details": blast_details,
            "drift_flags": drift_flags,
            "drift_debug": drift_debug,
            "decision": decision,
            "mode": MODE
        }
    except Exception as e:
        logger.error(f"Sentinel execution failed: {e}")
        return JSONResponse(
            status_code=500, 
            content={"error": str(e), "fallback_used": True, "traceback": traceback.format_exc()}
        )

if __name__ == "__main__":
    uvicorn.run("api_v3:app", host="127.0.0.1", port=8007, reload=True)