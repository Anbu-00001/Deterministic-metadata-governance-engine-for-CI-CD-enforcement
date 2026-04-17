"""PII detection governance skill.

Scans column names for patterns that indicate Personally Identifiable
Information and assigns a risk level.
"""

from __future__ import annotations

import re
from typing import Any

from sentinel.skills.base_skill import BaseSkill

PII_SEVERITY = {
    "ssn": "critical",
    "credit_card": "critical", 
    "email": "high",
    "phone": "high",
    "ip_address": "medium",
    "dob": "high",
    "name_pattern": "medium",
}

PATTERNS = {
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "credit_card": r"\b(?:\d{4}[ -]?){3}\d{4}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b",
    "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
}

DOB_PATTERNS = r"\b(dob|date_of_birth|birthdate)\b"
NAME_PATTERNS = r"\b(ssn|social_security|passport|national_id|tax_id|credit_card|cvv|pin)\b"

class PIIDetectionSkill(BaseSkill):
    """Detect columns with PII-like names and assess risk level.

    Attributes:
        name: ``"pii_detection"``
        description: Short description of the skill's purpose.
    """

    name: str = "pii_detection"
    description: str = "Scans column names for PII patterns and assigns risk levels."

    async def is_applicable(self, context: dict[str, Any]) -> bool:
        """Return True always, scanning all tables."""
        return True

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Run PII detection over column names and descriptions."""
        columns: list[dict[str, Any]] = context.get("columns", [])
        
        pii_columns = []
        violations = []
        
        critical_count = 0
        high_count = 0
        medium_count = 0
        
        for col in columns:
            col_name = str(col.get("name", ""))
            col_desc = str(col.get("description", ""))
            
            combined_text = f"{col_name} {col_desc}".lower()
            
            found_patterns = []
            
            for p_name, p_regex in PATTERNS.items():
                if re.search(p_regex, combined_text, re.IGNORECASE):
                    found_patterns.append(p_name)
                    
            if re.search(DOB_PATTERNS, combined_text, re.IGNORECASE):
                found_patterns.append("dob")
                
            if re.search(NAME_PATTERNS, combined_text, re.IGNORECASE):
                found_patterns.append("name_pattern")
                
            for p in set(found_patterns):
                severity = PII_SEVERITY[p]
                
                if severity == "critical":
                    critical_count += 1
                elif severity == "high":
                    high_count += 1
                elif severity == "medium":
                    medium_count += 1
                    
                pii_columns.append({
                    "column_name": col_name,
                    "pattern_matched": p,
                    "severity": severity
                })
                violations.append(f"PII detected in column '{col_name}': {p} ({severity} severity)")

        score = 1.0 - (critical_count * 0.4 + high_count * 0.2 + medium_count * 0.1)
        score = max(0.0, min(score, 1.0))
        
        return {
            "pii_columns": pii_columns,
            "pii_column_count": len(set(c["column_name"] for c in pii_columns)),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "score": score,
            "violations": violations
        }
