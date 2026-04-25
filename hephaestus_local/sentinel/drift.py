import json
from sentence_transformers import SentenceTransformer, util

# Load model globally to cache it
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

def calculate_drift(schema_path, catalog_path):
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    with open(catalog_path, 'r') as f:
        catalog = json.load(f)
        
    schema_cols = {col['name']: col.get('description', '') for col in schema.get('columns', [])}
    catalog_cols = {col['name']: col.get('description', '') for col in catalog.get('columns', [])}
    
    drift_results = {}
    
    for name, s_desc in schema_cols.items():
        c_desc = catalog_cols.get(name, "")
        
        if not s_desc or not c_desc:
            if s_desc == c_desc:
                drift_results[name] = 1.0
            else:
                drift_results[name] = 0.0
            continue
            
        if model:
            embs1 = model.encode(s_desc, convert_to_tensor=True)
            embs2 = model.encode(c_desc, convert_to_tensor=True)
            cosine_scores = util.cos_sim(embs1, embs2)
            sim = cosine_scores[0][0].item()
        else:
            sim = 0.0
            
        drift_results[name] = round(sim, 4)
        
    return drift_results
