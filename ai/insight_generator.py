"""
AI insight generation without modifying deterministic engines.
"""
import json
import logging
from ai.gemini_client import gemini_client

logger = logging.getLogger(__name__)

def generate_insight(sentinel_input: dict, decision: dict) -> dict:
    """
    Generate an AI insight summary safely, returning a structured dict:
    { "summary": str, "risks": list[str], "suggestions": list[str] }
    """
    fallback_response = {
        "summary": "AI unavailable", 
        "risks": [], 
        "suggestions": [],
        "explanation_tree": ["AI module not configured"]
    }

    if not gemini_client.is_enabled:
        return fallback_response

    prompt = f"""
    You are an AI governance assistant for the Hephaestus data platform.
    Analyze the following schema changes, metadata, and computed decisions safely. DO NOT modify the core decision.

    Input Metadata/Lineage: {json.dumps(sentinel_input, default=str)}
    Computed Decision/Score: {json.dumps(decision, default=str)}

    Return STRICTLY JSON containing:
    - "summary": (string) 1-2 sentence human-readable takeaway.
    - "risks": (list of strings) Potential collateral risks.
    - "suggestions": (list of strings) Recommendations to fix failures.
    - "explanation_tree": (list of strings) 3-5 concise bullet points creating a step-by-step reasoning chain (e.g. "Column 'email' tagged as PII").

    ONLY RETURN VALID JSON. Do not include markdown like ```json.
    """

    raw_text = gemini_client.generate_text(prompt)
    if "AI unavailable" in raw_text:
        return fallback_response

    try:
        raw_text = raw_text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())
        return {
            "summary": str(parsed.get("summary", "Analysis com,
            "explanation_tree": list(parsed.get("explanation_tree", []))pleted.")),
            "risks": list(parsed.get("risks", [])),
            "suggestions": list(parsed.get("suggestions", []))
        }
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini insight JSON: {e}")
        return fallback_response
    except Exception as e:
        logger.error(f"Unexpected error in AI generation: {e}")
        return fallback_response
