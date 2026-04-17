import inspect
from pathlib import Path
from sentinel.skills.base_skill import BaseSkill

class SkillsLoader:
    def __init__(self, skills_dir: Path | None = None):
        self.skills_dir = skills_dir or Path(__file__).parent
        self._registry: dict[str, type[BaseSkill]] = {}
        
    def discover(self) -> dict[str, type[BaseSkill]]:
        self._registry.clear()
        
        for item in self.skills_dir.iterdir():
            if item.is_dir() and item.name != "__pycache__":
                skill_file = item / "skill.py"
                if skill_file.exists():
                    import importlib.util
                    spec = importlib.util.spec_from_file_location(f"sentinel.skills.{item.name}.skill", skill_file)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        for name, obj in inspect.getmembers(module):
                            if inspect.isclass(obj) and issubclass(obj, BaseSkill) and obj is not BaseSkill:
                                instance = obj()
                                self._registry[instance.name] = obj
                                break
        return self._registry
        
    def get_skill(self, name: str) -> BaseSkill:
        if name not in self._registry:
            raise KeyError(f"Skill '{name}' not found.")
        return self._registry[name]()
        
    def list_skills(self) -> list[str]:
        return sorted(self._registry.keys())
