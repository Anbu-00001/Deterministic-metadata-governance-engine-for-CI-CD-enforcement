"""Abstract base class for all Hephaestus governance skills.

Every skill must inherit from :class:`BaseSkill` and implement
:meth:`execute` and optionally override :meth:`is_applicable`.

Skills are discovered at runtime by :mod:`sentinel.skills.skills_loader`
via dynamic import of ``skill.py`` files in sub-directories.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseSkill(ABC):
    """Abstract base class that every governance skill inherits.

    Subclasses **must** set the class-level ``name`` and ``description``
    attributes and implement :meth:`execute`.  Override
    :meth:`is_applicable` to control when the skill is activated.

    Attributes:
        name: Short machine-readable identifier (e.g. ``"pii_detection"``).
        description: Human-readable one-liner explaining the skill's purpose.
    """

    name: str = ""
    description: str = ""

    @abstractmethod
    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Run the skill's governance check.

        Args:
            context: PR-scoped context dict containing entity metadata,
                column names, lineage data, etc.

        Returns:
            A dict with skill-specific findings (e.g. violations, risk
            levels, recommendations).
        """
        ...  # pragma: no cover

    async def is_applicable(self, context: dict[str, Any]) -> bool:
        """Determine whether this skill should run for the given context.

        The default implementation returns ``True`` — override for skills
        that should only activate under specific conditions.

        Args:
            context: Same PR-scoped context dict passed to :meth:`execute`.

        Returns:
            ``True`` if the skill should execute.
        """
        return True
