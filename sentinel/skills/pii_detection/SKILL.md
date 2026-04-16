# PII Detection Skill

## Purpose
Scans column names for patterns that indicate Personally Identifiable
Information (PII). Flags columns matching known PII patterns and assigns
a risk level based on the severity and count of matches.

## Activation
Runs when **any** column name in the PR context matches a PII regex
pattern (email, SSN, phone, date-of-birth, address, credit-card, etc.).

## Output
```json
{
  "pii_columns": ["customer_email", "ssn"],
  "risk_level": "HIGH"
}
```

## Risk Levels
- **HIGH**: 3 + PII columns, or any SSN / credit-card match.
- **MEDIUM**: 1–2 PII columns of non-critical types.
- **LOW**: Patterns matched but only on non-sensitive column names.
