"""GitHub sink listener — watches for OpenMetadata catalog sink commits.

Detects commits whose message starts with ``chore(openmetadata-sink):``
and applies the entity updates to local dbt schema files.  Idempotent —
re-processing the same commit produces no change.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import yaml
from git import Repo

from config import settings

logger = logging.getLogger(__name__)

SINK_COMMIT_PREFIX = "chore(openmetadata-sink):"


class GitHubSinkListener:
    """Polls the repo for OpenMetadata sink commits and applies patches.

    Args:
        repo_path: Local filesystem path to the cloned git repository.
    """

    def __init__(self, repo_path: str | None = None) -> None:
        self._repo_path = repo_path or settings.repo_path
        self._repo = Repo(self._repo_path)
        self._processed_shas: set[str] = set()

    @property
    def repo(self) -> Repo:
        """Return the underlying ``git.Repo`` instance."""
        return self._repo

    def scan_for_sink_commits(self, max_commits: int = 50) -> list[Any]:
        """Return unprocessed sink commits from the repository.

        Args:
            max_commits: Maximum number of recent commits to inspect.

        Returns:
            List of ``git.Commit`` objects matching the sink prefix,
            ordered oldest-first, excluding already-processed SHAs.
        """
        sink_commits = []
        for commit in self._repo.iter_commits(max_count=max_commits):
            sha = commit.hexsha
            if sha in self._processed_shas:
                continue
            if commit.message.strip().startswith(SINK_COMMIT_PREFIX):
                sink_commits.append(commit)
        # Process in chronological order.
        sink_commits.reverse()
        return sink_commits

    def apply_commit(self, commit: Any) -> bool:
        """Apply a single sink commit to local dbt schema files.

        Reads YAML files changed in the commit, parses entity metadata
        updates, and merges them into the corresponding
        ``schema.yml`` files.

        Args:
            commit: A ``git.Commit`` object.

        Returns:
            ``True`` if changes were applied, ``False`` if already
            up-to-date (idempotent).
        """
        sha = commit.hexsha
        if sha in self._processed_shas:
            logger.info("Commit %s already processed — skipping.", sha[:8])
            return False

        changed_files = self._get_changed_files(commit)
        applied = False

        for file_path in changed_files:
            if not file_path.endswith((".yml", ".yaml")):
                continue

            full_path = Path(self._repo_path) / file_path
            if not full_path.exists():
                logger.warning("File %s from commit %s not found on disk.", file_path, sha[:8])
                continue

            try:
                blob = commit.tree / file_path
                content = blob.data_stream.read().decode("utf-8")
                entity_updates = yaml.safe_load(content)
            except Exception:
                logger.warning(
                    "Failed to parse %s from commit %s",
                    file_path,
                    sha[:8],
                    exc_info=True,
                )
                continue

            if entity_updates:
                self._merge_into_schema(full_path, entity_updates)
                applied = True

        self._processed_shas.add(sha)
        logger.info("Processed sink commit %s (applied=%s).", sha[:8], applied)
        return applied

    # ── Internal helpers ─────────────────────────────────────

    @staticmethod
    def _get_changed_files(commit: Any) -> list[str]:
        """Extract paths of files changed in a commit."""
        if commit.parents:
            diffs = commit.diff(commit.parents[0])
        else:
            diffs = commit.diff(None)
        return [d.a_path or d.b_path for d in diffs if d.a_path or d.b_path]

    @staticmethod
    def _merge_into_schema(
        schema_path: Path,
        updates: dict[str, Any] | list[Any],
    ) -> None:
        """Merge entity metadata updates into a dbt ``schema.yml`` file.

        Args:
            schema_path: Path to the local schema YAML file.
            updates: Parsed YAML content from the sink commit.
        """
        try:
            with schema_path.open("r", encoding="utf-8") as fh:
                existing = yaml.safe_load(fh) or {}
        except FileNotFoundError:
            existing = {}

        if isinstance(updates, dict):
            # Shallow merge — preserves existing keys not in update.
            if isinstance(existing, dict):
                existing.update(updates)
            else:
                existing = updates
        else:
            existing = updates

        with schema_path.open("w", encoding="utf-8") as fh:
            yaml.safe_dump(existing, fh, default_flow_style=False, sort_keys=False)

        logger.debug("Merged updates into %s.", schema_path)
