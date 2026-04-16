"""Timeline builder for the Chronos dashboard.

Pure function — no I/O. Takes a list of snapshot dicts and returns them
sorted and enriched with human-readable age strings.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def build_timeline(snapshots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sort snapshots by timestamp (newest first) and add ``age_human``.

    Args:
        snapshots: List of snapshot dicts, each with at least a
            ``"timestamp"`` key in ISO-8601 format.

    Returns:
        A new list of snapshot dicts, each augmented with an ``age_human``
        field (e.g. ``"2 hours ago"``, ``"3 days ago"``).
    """
    now = datetime.now(timezone.utc)

    enriched: list[dict[str, Any]] = []
    for snap in snapshots:
        entry = dict(snap)  # shallow copy — non-destructive
        ts_raw = snap.get("timestamp", "")
        try:
            ts = datetime.fromisoformat(ts_raw)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            delta = now - ts
            entry["age_human"] = _humanize_delta(delta.total_seconds())
        except (ValueError, TypeError):
            entry["age_human"] = "unknown"
        enriched.append(entry)

    # Sort newest-first.
    enriched.sort(
        key=lambda s: s.get("timestamp", ""),
        reverse=True,
    )
    return enriched


def _humanize_delta(seconds: float) -> str:
    """Convert a duration in seconds to a human-friendly string.

    Args:
        seconds: Non-negative duration.

    Returns:
        A string like ``"just now"``, ``"5 minutes ago"``, ``"2 hours ago"``,
        ``"3 days ago"``.
    """
    if seconds < 60:
        return "just now"
    minutes = int(seconds // 60)
    if minutes < 60:
        unit = "minute" if minutes == 1 else "minutes"
        return f"{minutes} {unit} ago"
    hours = int(minutes // 60)
    if hours < 24:
        unit = "hour" if hours == 1 else "hours"
        return f"{hours} {unit} ago"
    days = int(hours // 24)
    unit = "day" if days == 1 else "days"
    return f"{days} {unit} ago"
