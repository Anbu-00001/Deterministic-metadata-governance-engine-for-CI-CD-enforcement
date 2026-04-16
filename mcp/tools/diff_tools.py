"""MCP tools for schema and data diff operations.

Provides ``get_data_diff`` (raw diff from OpenMetadata data-quality API)
and ``compare_schemas`` (column-level diff between two entity snapshots).
"""

from __future__ import annotations

from typing import Any

import httpx

from config import settings
from mcp.tools.entity_tools import get_entity


async def _get_client() -> httpx.AsyncClient:
    """Build an ``httpx.AsyncClient`` preconfigured for OpenMetadata."""
    return httpx.AsyncClient(
        base_url=settings.openmetadata_api_url,
        headers={
            "Authorization": f"Bearer {settings.openmetadata_jwt_token}",
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )


def _raise_on_error(response: httpx.Response, context: str) -> None:
    """Raise a descriptive ``RuntimeError`` for non-2xx responses."""
    if not response.is_success:
        raise RuntimeError(
            f"{context} failed — HTTP {response.status_code}: {response.text}"
        )


async def get_data_diff(
    source_table_fqn: str,
    target_table_fqn: str,
) -> dict[str, Any]:
    """Fetch a raw data diff between two tables from the OpenMetadata API.

    Args:
        source_table_fqn: FQN of the source (before) table.
        target_table_fqn: FQN of the target (after) table.

    Returns:
        The raw diff JSON as a dict.

    Raises:
        RuntimeError: On non-2xx API response.
    """
    async with await _get_client() as client:
        response = await client.get(
            "/dataQuality/testSuites/diff",
            params={"source": source_table_fqn, "target": target_table_fqn},
        )
        _raise_on_error(
            response,
            f"GET /dataQuality/testSuites/diff (source={source_table_fqn})",
        )
        return response.json()


async def compare_schemas(
    fqn_before: str,
    fqn_after: str,
) -> dict[str, Any]:
    """Compare two entity schemas by column name.

    Fetches both entities via :func:`get_entity` and produces a column-level
    diff grouped into ``added_columns``, ``removed_columns``, and
    ``modified_columns``.

    A column is **modified** if it exists in both snapshots but its
    ``dataType`` or ``description`` has changed.

    Args:
        fqn_before: FQN of the baseline entity.
        fqn_after: FQN of the updated entity.

    Returns:
        A dict with three keys: ``added_columns``, ``removed_columns``,
        ``modified_columns``.  Each value is a list of column-name strings
        (or dicts for modified columns showing before/after).
    """
    entity_before = await get_entity("tables", fqn_before)
    entity_after = await get_entity("tables", fqn_after)

    cols_before: dict[str, dict[str, Any]] = {
        col["name"]: col for col in entity_before.get("columns", [])
    }
    cols_after: dict[str, dict[str, Any]] = {
        col["name"]: col for col in entity_after.get("columns", [])
    }

    before_names = set(cols_before.keys())
    after_names = set(cols_after.keys())

    added = sorted(after_names - before_names)
    removed = sorted(before_names - after_names)

    modified: list[dict[str, Any]] = []
    for name in sorted(before_names & after_names):
        old = cols_before[name]
        new = cols_after[name]
        changes: dict[str, Any] = {"column": name}
        has_change = False
        if old.get("dataType") != new.get("dataType"):
            changes["dataType_before"] = old.get("dataType")
            changes["dataType_after"] = new.get("dataType")
            has_change = True
        if old.get("description") != new.get("description"):
            changes["description_before"] = old.get("description", "")
            changes["description_after"] = new.get("description", "")
            has_change = True
        if has_change:
            modified.append(changes)

    return {
        "added_columns": added,
        "removed_columns": removed,
        "modified_columns": modified,
    }
