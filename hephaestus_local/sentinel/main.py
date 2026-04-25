import os
import sys
from sentinel.fgs import calculate_fgs
from sentinel.drift import calculate_drift

def run_evaluation(schema_path, catalog_path, lineage_path, model_name):
    # Adjust schema_path to absolute if needed
    fgs_raw, fgs_norm, col_contribs, r_blast, blast_breakdown = calculate_fgs(schema_path, lineage_path, model_name)
    drift_scores = calculate_drift(schema_path, catalog_path)
    
    print("-----------------------------------")
    print(f"📊 HEPHAESTUS SENTINEL UPGRADED EVALUATION ({os.path.basename(schema_path)})")
    print("-----------------------------------")
    
    print("\nColumn Contributions:")
    for col, data in col_contribs.items():
        print(f"  - {col} -> {data['c_i']} * {data['t_i']} = {round(data['contrib'], 2)}")
        
    print(f"\nBlast Penalty (Total R_blast: {round(r_blast, 4)}):")
    if not blast_breakdown:
        print("  - None")
    for node, data in blast_breakdown.items():
        print(f"  - {node} (depth {data['depth']}, weight {data['weight']}) -> penalty {round(data['penalty'], 4)}")

    print("\nSemantic Drift Scores:")
    for col, score in drift_scores.items():
        drift_flag = "⚠️ DRIFT DETECTED" if score < 0.85 else "✅ OK"
        print(f"  - {col}: {score} {drift_flag}")
        
    print("-----------------------------------")
    print(f"Raw FGS Score: {round(fgs_raw, 4)}")
    print(f"Normalized FGS Score: {round(fgs_norm, 4)}")
    
    if fgs_norm < 0.6:
        print("FINAL DECISION: 🛑 BLOCK")
    else:
        print("FINAL DECISION: 🟢 PASS")
    print("\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        schema = sys.argv[1]
    else:
        # Default test
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        schema = os.path.join(data_dir, 'schema.json')
        
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    catalog = os.path.join(data_dir, 'catalog.json')
    lineage = os.path.join(data_dir, 'lineage.json')
    
    run_evaluation(schema, catalog, lineage, "users_model")
