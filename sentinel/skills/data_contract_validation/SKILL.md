# Data Contract Validation Skill

## Purpose
Validates ODCS 3.1 data contract YAML files for required field presence
and structural correctness.

## Activation
Runs when the PR context includes a ``contract_path`` key pointing to an
ODCS 3.1 YAML file.

## Output
```json
{
  "valid": true,
  "violations": []
}
```
or
```json
{
  "valid": false,
  "violations": [
    "Missing required field: owner",
    "Column at index 2 missing required field: type"
  ]
}
```

## Validated Fields
- ``datasetName`` (string, required)
- ``version`` (string, required)
- ``owner`` (string, required)
- ``columns`` (list, required) — each entry must have ``name`` and ``type``
