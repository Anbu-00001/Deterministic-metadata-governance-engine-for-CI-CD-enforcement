from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class SkillContext:
    """All data a skill needs to run a governance check."""
    table_fqn: str
    columns: list[dict[str, Any]]
    pr_number: int
    changed_files: list[str]
    extra: dict[str, Any]

@dataclass
class SkillResult:
    skill_name: str
    passed: bool
    score: float
    violations: list[str]
    metadata: dict[str, Any]

class BaseSkill(ABC):
    """Abstract base for all Hephaestus governance skills."""
    
    @property
    @abstractmethod
    def name(self) -> str: ...
    
    @property
    @abstractmethod
    def description(self) -> str: ...
    
    @abstractmethod
    def run(self, context: SkillContext) -> SkillResult: ...
