"""MCP tools for OpenMetadata entity CRUD operations.

Provides ``get_entity``, ``patch_entity``, and ``list_entities`` — thin
async wrappers around the OpenMetadata REST API that handle authentication,
error raising, and JSON deserialisation.
"""

from __future__ import annotations

from typing import Any

import httpx

from config import settings


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


# ── Tool functions ───────────────────────────────────────────


async def get_entity(entity_type: str, fqn: str) -> dict[str, Any]:
    """Retrieve a single OpenMetadata entity by its fully-qualified name.

    Args:
        entity_type: OpenMetadata entity kind (e.g. ``"tables"``, ``"dashboards"``).
        fqn: Fully-qualified name of the entity.

    Returns:
        The complete entity JSON as a dict.

    Raises:
        RuntimeError: If the API returns a non-2xx status code.
    """
    async with await _get_client() as client:
        response = await client.get(f"/{entity_type}/name/{fqn}")
        _raise_on_error(response, f"GET /{entity_type}/name/{fqn}")
        return response.json()


async def patch_entity(
    entity_type: str,
    entity_id: str,
    patch_ops: list[dict[str, Any]],
) -> dict[str, Any]:
    """Apply an RFC-6902 JSON Patch to an OpenMetadata entity.

    Args:
        entity_type: OpenMetadata entity kind.
        entity_id: UUID of the entity to patch.
        patch_ops: List of JSON Patch operation dicts
                   (e.g. ``[{"op":"replace","path":"/description","value":"…"}]``).

    Returns:
        The patched entity JSON as a dict.

    Raises:
        RuntimeError: If the API returns a non-2xx status code.
    """
    async with await _get_client() as client:
        response = await client.patch(
            f"/{entity_type}/{entity_id}",
            json=patch_ops,
            headers={
                "Content-Type": "application/json-patch+json",
                "Authorization": f"Bearer {settings.openmetadata_jwt_token}",
            },
        )
        _raise_on_error(response, f"PATCH /{entity_type}/{entity_id}")
        return response.json()


async def list_entities(
    entity_type: str,
    fields: str = "name,description",
) -> list[dict[str, Any]]:
    """List OpenMetadata entities of a given type.

    Args:
        entity_type: OpenMetadata entity kind.
        fields: Comma-separated field names to include in the response.

    Returns:
        A list of entity dicts.

    Raises:
        RuntimeError: If the API returns a non-2xx status code.
    """
    async with await _get_client() as client:
        response = await client.get(
            f"/{entity_type}",
            params={"fields": fields, "limit": 100},
        )
        _raise_on_error(response, f"GET /{entity_type}")
        body = response.json()
        return body.get("data", [])
