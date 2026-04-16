"""On-demand skill registry — discovers and loads governance skills.

Scans ``sentinel/skills/`` subdirectories for ``skill.py`` modules,
imports them, and registers any class inheriting from
:class:`~sentinel.skills.base_skill.BaseSkill`.  Skills are filtered
per-context via :meth:`BaseSkill.is_applicable` to prevent tool bloat.
"""

from __future__ import annotations

import importlib
import inspect
import logging
from pathlib import Path
from typing import Any

from sentinel.skills.base_skill import BaseSkill

logger = logging.getLogger(__name__)


class SkillsLoader:
    """Dynamic skill discovery and context-aware loading.

    On construction, scans the ``sentinel/skills/`` directory tree for
    ``skill.py`` files and registers every concrete :class:`BaseSkill`
    subclass found.  No network calls or heavy work happens at init time.
    """

    def __init__(self) -> None:
        self._registry: dict[str, type[BaseSkill]] = {}
        self._discover()

    # ── Discovery ────────────────────────────────────────────

    def _discover(self) -> None:
        """Walk skill directories and import ``skill.py`` modules."""
        skills_root = Path(__file__).resolve().parent
        for skill_file in skills_root.rglob("skill.py"):
            # Build a dotted module path relative to the project root.
            # e.g. sentinel.skills.pii_detection.skill
            parts = skill_file.relative_to(skills_root.parent.parent).with_suffix("").parts
            module_path = ".".join(parts)
            try:
                module = importlib.import_module(module_path)
            except Exception:
                logger.warning("Failed to import skill module %s", module_path, exc_info=True)
                continue

            for _name, obj in inspect.getmembers(module, inspect.isclass):
                if (
                    issubclass(obj, BaseSkill)
                    and obj is not BaseSkill
                    and getattr(obj, "name", "")
                ):
                    self._registry[obj.name] = obj
                    logger.debug("Registered skill: %s", obj.name)

    # ── Public interface ─────────────────────────────────────

    @property
    def registered_skills(self) -> list[str]:
        """Return the names of all discovered skills."""
        return sorted(self._registry.keys())

    async def load_applicable(
        self,
        context: dict[str, Any],
    ) -> list[BaseSkill]:
        """Instantiate and return only skills applicable to *context*.

        Args:
            context: PR-scoped context dict (entity metadata, column names,
                lineage, etc.).

        Returns:
            List of instantiated :class:`BaseSkill` subclasses whose
            :meth:`is_applicable` returned ``True``.
        """
        applicable: list[BaseSkill] = []
        for skill_cls in self._registry.values():
            instance = skill_cls()
            try:
                if await instance.is_applicable(context):
                    applicable.append(instance)
            except Exception:
                logger.warning(
                    "Error checking applicability for skill %s",
                    skill_cls.name,
                    exc_info=True,
                )
        return applicable
