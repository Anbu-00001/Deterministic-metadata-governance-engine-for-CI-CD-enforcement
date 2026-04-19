import pytest
from integrations.gemini_client import GeminiClient

class MockSettings:
    gemini_api_key = None

def test_gemini_client_no_key(monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "gemini_api_key", None)
    
    client = GeminiClient()
    assert client.is_enabled() is False
    assert client.generate_suggestion("test") == "Gemini AI analysis not configured."

def test_gemini_client_with_key(monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "dummy_key")
    
    client = GeminiClient()
    assert client.is_enabled() is True
    assert "AI evaluation placeholder" in client.generate_suggestion("test context")