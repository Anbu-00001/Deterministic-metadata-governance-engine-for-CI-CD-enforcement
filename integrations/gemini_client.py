"""
Gemini Client Integration
"""
from config import settings

class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key

    def is_enabled(self) -> bool:
        return bool(self.api_key)

    def generate_suggestion(self, context: str) -> str:
        if not self.is_enabled():
            return "Gemini AI analysis not configured."

        # Placeholder for future Gemini API call
        return f"AI evaluation placeholder for '{context}'"

gemini_client = GeminiClient()
