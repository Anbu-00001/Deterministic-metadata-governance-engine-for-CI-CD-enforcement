import re
from typing import Any
from sentinel.skills.base_skill import BaseSkill, SkillContext, SkillResult

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
    @property
    def name(self) -> str:
        return "pii_detection"
        
    @property
    def description(self) -> str:
        return "Detects PII data in column names and descriptions."
        
    def run(self, context: SkillContext) -> SkillResult:
        pii_columns = []
        violations = []
        
        critical_count = 0
        high_count = 0
        medium_count = 0
        
        for col in context.columns:
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
        
        passed = False
        if score >= 0.7 and critical_count == 0:
            passed = True
            
        metadata = {
            "pii_columns": pii_columns,
            "pii_column_count": len(set(c["column_name"] for c in pii_columns)),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count
        }
        
        return SkillResult(
            skill_name=self.name,
            passed=passed,
            score=score,
            violations=violations,
            metadata=metadata
        )
