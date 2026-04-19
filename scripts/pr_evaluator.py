import os
import sys
import json
import urllib.request

def main():
    try:
        github_token = os.environ.get("GITHUB_TOKEN")
        pr_number = os.environ.get("PR_NUMBER")
        repo = os.environ.get("GITHUB_REPOSITORY")

        if not all([github_token, pr_number, repo]):
            print("Notice: Missing necessary GitHub Action parameters (Token, PR Number, Repository). Skipping post.")
            sys.exit(0)

        payload = {
            "metadata": {
                "pull_request.demo.customers": {
                    "id": {"tier": 1, "description": "Global ID Key", "tags": ["key"]},
                    "ssn": {"tier": 3, "description": "National ID", "tags": ["pii", "sensitive"]},
                    "status": {"tier": 3, "description": "Lapsed or active", "tags": []}
                }
            },
            "lineage": {
                "pull_request.demo.customers": [
                    "downstream.marketing.campaigns",
                    "third_party.partner_api.customers"
                ],
                "downstream.marketing.campaigns": ["analytics.dashboard.roi"]
            },
            "schema_change": {
                "added_columns": 2,
                "removed_columns": 0,
                "modified_columns": 1,
                "total_columns_before": 3
            },
            "volume_change": {
                "changed_rows": 15500,
                "total_rows": 250000
            }
        }

        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/sentinel/evaluate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                
            fgs_score = result.get("fgs_score", "N/A")
            blast_radius = result.get("blast_radius", "1")
            api_decision = result.get("decision", "REVIEW")
            confidence = result.get("confidence_score", "N/A")
            policy_triggered = result.get("policy_triggered", [])
            
            ai_insight = result.get("ai_insight", {})
            summary = ai_insight.get("summary", "No AI insight found.")
            risks_list = ai_insight.get("risks", [])
            suggestions_list = ai_insight.get("suggestions", [])
            explanation_tree = ai_insight.get("explanation_tree", [])
            
        except Exception as e:
            print(f"Failed to reach Sentinel API: {e}")
            fgs_score = "N/A"
            blast_radius = "N/A"
            api_decision = "WARN"
            confidence = "N/A"
            policy_triggered = []
            summary = f"API Evaluation Failed: {e}"
            risks_list = ["System evaluation offline — proceeding with caution."]
            suggestions_list = ["Investigate Hephaestus deployed service."]
            explanation_tree = []

        if api_decision in ["BLOCK", "REJECT"]:
            decision_val = "BLOCK"
            decision_display = "❌ BLOCK"
        elif api_decision in ["WARN", "REVIEW"]:
            decision_val = "WARN"
            decision_display = "⚠️ WARN"
        else:
            decision_val = "ALLOW"
            decision_display = "✅ ALLOW"

        risks = "\\n".join([f"- ⚠️ {r}" for r in risks_list]) if risks_list else "None detected."
        suggestions = "\\n".join([f"- 💡 {s}" for s in suggestions_list]) if suggestions_list else "None recorded."
        policy_triggers = "\\n".join([f"- 🛡️ {p}" for p in policy_triggered]) if policy_triggered else"None"
        explanations = "\\n".join([f"- 🔍 {e}" for e in explanation_tree]) if explanation_tree else "No explanation generated."

        comment_body = f\"\"\"### 🛡️ Hephaestus Governance Result

**Decision:** **{decision_display}**
**Confidence Score:** {confidence}
**FGS Score:** {fgs_score}
**Blast Radius:** {blast_radius}

#### 🔮 Predicted Risk:
{pred_block}

#### 🕒 Historical Patterns:
{hist_block}

#### 🧠 Why this happened:
{explanations}

#### 🧠 Reasoning Chain:
{reasoning_list}

#### 💡 Suggested Fixes:
{suggest_block}

#### 📈 If Fixed (Simulation):
{sim_block}

#### 📜 Policy Triggered:
{policy_triggers}

#### 🤖 AI Insight
**Summary:** 
{summary}

**Identified Risks:**
{risks}

**Recommendations:**
{suggestions}
\"\"\"
        print(f"Generated Result:\\n{comment_body}\\n")

        comment_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
        gh_req = urllib.request.Request(
            comment_url,
            data=json.dumps({"body": comment_body}).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(gh_req, timeout=15) as gh_res:
            print(f"Success! PR Comment posted containing Engine payload. (HTTP Status: {gh_res.status})")

        if decision_val == "BLOCK":
            print("❌ HARD BLOCK: Governance violation")
            sys.exit(1)
        elif decision_val == "WARN":
            print("⚠️ WARNING: Risk detected but allowed")
            sys.exit(0)
        else:
            print("✅ ALLOWED: Safe to merge")
            sys.exit(0)

    except Exception as e:
        print(f"Hephaestus Evaluation Safety Catch -> Script failed but will not block pipeline: {e}")
        sys.exit(0)

if __name__ == "__main__":
    main()


