"""
Gemini Client Initialization and Safe Invocation
"""
import logging
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.is_enabled = bool(self.api_key)
        
        if self.is_enabled:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def generate_text(self, prompt: str) -> str:
        """Safely invokes the Gemini API and returns generated text."""
        if not self.is_enabled:
            return "AI unavailable: Gemini API key not configured."

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except GoogleAPIError as e:
            logger.error(f"Google Generative AI Error: {e}")
            return "AI unavailable: Model failed."
        except Exception as e:
            logger.error(f"Unexpected Gemini Error: {e}")
            return "AI unavailable: Unexpected failure."

gemini_client = GeminiClient()
