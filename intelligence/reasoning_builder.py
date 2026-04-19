# intelligence/reasoning_builder.py

def build_reasoning_chain(metrics, triggered_policies, ai_insight=None):
    chain = []
    
    # 1. Start with the problem metrics
    fgs = metrics.get('fgs_score', 100)
    blast = metrics.get('blast_radius', 0)
    
    chain.append(f"Detected: FGS evaluated at {fgs}.")
    
    if blast > 0:
        chain.append(f"Detected: Blast radius extends to {blast} downstream tables.")
        
    if fgs < 50:
        chain.append(f"FGS Penalty applied due to missing or sparse metadata.")

    if triggered_policies:
        for policy in triggered_policies:
            chain.append(f"Policy triggered: {policy}")
            
    # Combine with AI insights if we can
    if ai_insight and 'explanation_tree' in ai_insight:
        for tree_node in ai_insight['explanation_tree']:
            chain.append(f"AI Insight context: {tree_node}")
            
    if not chain:
        chain.append("Safe change detected with no governance flags.")
        
    return chain
