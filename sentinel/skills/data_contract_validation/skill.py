"""Data-contract validation governance skill.

Validates ODCS 3.1 data-contract YAML files against the required
field schema: ``datasetName``, ``version``, ``owner``, and ``columns``
(each with ``name`` and ``type``).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from sentinel.skills.base_skill import BaseSkill

# Top-level required fields and their expected types.
REQUIRED_FIELDS: dict[str, type] = {
    "datasetName": str,
    "version": str,
    "owner": str,
    "columns": list,
}

# Required fields inside each column entry.
REQUIRED_COLUMN_FIELDS: list[str] = ["name", "type"]


class DataContractValidationSkill(BaseSkill):
    """Validate ODCS 3.1 data-contract YAML files.

    Attributes:
        name: ``"data_contract_validation"``
        description: Short description of the skill's purpose.
    """

    name: str = "data_contract_validation"
    description: str = "Validates ODCS 3.1 data contracts for required fields and structure."

    async def is_applicable(self, context: dict[str, Any]) -> bool:
        """Return ``True`` if the context contains a ``contract_path``.

        Args:
            context: PR-scoped context dict.

        Returns:
            ``True`` when ``"contract_path"`` is present and non-empty.
        """
        contract_path = context.get("contract_path", "")
        return bool(contract_path)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Load and validate the ODCS 3.1 contract at ``context["contract_path"]``.

        Args:
            context: Must contain ``"contract_path"`` (str path to YAML).

        Returns:
            ``{"valid": bool, "violations": list[str]}``
        """
        contract_path = Path(context["contract_path"])
        violations: list[str] = []

        # Load the YAML file.
        try:
            with contract_path.open("r", encoding="utf-8") as fh:
                contract = yaml.safe_load(fh)
        except FileNotFoundError:
            return {"valid": False, "violations": [f"Contract file not found: {contract_path}"]}
        except yaml.YAMLError as exc:
            return {"valid": False, "violations": [f"Invalid YAML: {exc}"]}

        if not isinstance(contract, dict):
            return {"valid": False, "violations": ["Contract root must be a YAML mapping."]}

        # Validate top-level required fields.
        for field, expected_type in REQUIRED_FIELDS.items():
            value = contract.get(field)
            if value is None:
                violations.append(f"Missing required field: {field}")
            elif not isinstance(value, expected_type):
                violations.append(
                    f"Field '{field}' must be {expected_type.__name__}, "
                    f"got {type(value).__name__}"
                )

        # Validate column entries.
        columns = contract.get("columns")
        if isinstance(columns, list):
            for idx, col in enumerate(columns):
                if not isinstance(col, dict):
                    violations.append(f"Column at index {idx} must be a mapping.")
                    continue
                for req_field in REQUIRED_COLUMN_FIELDS:
                    if req_field not in col:
                        violations.append(
                            f"Column at index {idx} missing required field: {req_field}"
                        )

        return {
            "valid": len(violations) == 0,
            "violations": violations,
        }
