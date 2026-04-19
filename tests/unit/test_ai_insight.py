import pytest
from unittest.mock import MagicMock
from ai.insight_generator import generate_insight
from ai.gemini_client import GeminiClient

def test_ai_insight_no_key(monkeypatch):
    # Ensure client falls back safety if no key is given
    monkeypatch.setattr("ai.gemini_client.gemini_client.is_enabled", False)
    
    result = generate_insight({"schema": "change"}, {"score": 50})
    
    assert result["summary"] == "AI unavailable"
    assert result["risks"] == []
    assert result["suggestions"] == []

def test_ai_insight_with_mock_response(monkeypatch):
    monkeypatch.setattr("ai.gemini_client.gemini_client.is_enabled", True)
    
    def mock_generate_text(prompt: str) -> str:
        return '{"summary": "Test Summary", "risks": ["Risk 1"], "suggestions": ["Suggest 1"]}'
        
    monkeypatch.setattr("ai.gemini_client.gemini_client.generate_text", mock_generate_text)
    
    result = generate_insight({"schema": "change"}, {"score": 85})
    
    assert result["summary"] == "Test Summary"
    assert "Risk 1" in result["risks"]
    assert "Suggest 1" in result["suggestions"]

def test_ai_insight_json_failure(monkeypatch):
    monkeypatch.setattr("ai.gemini_client.gemini_client.is_enabled", True)
    
    # Model returns broken JSON
    def mock_generate_text(prompt: str) -> str:
        return 'Not JSON output'
        
    monkeypatch.setattr("ai.gemini_client.gemini_client.generate_text", mock_generate_text)
    
    # Should safely catch exception and return fallback
    result = generate_insight({}, {})
    assert result["summary"] == "AI unavailable"
